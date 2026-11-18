import base64
import copy
import hashlib
import io
from pathlib import Path
import sys
import unittest
import urllib.request
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from docs_pipeline import SafeRedirect, add_release, bundle, content_digest, fetch_docs, safe_path, stable_version, unpack
from sync_catalog import verify_event


class PipelineTests(unittest.TestCase):
    def test_archive_roundtrip_and_identity(self):
        files = {"index.mdx": b"# Welcome", "images/a.png": b"test"}
        self.assertEqual(bundle(files), bundle(dict(reversed(list(files.items())))))
        self.assertEqual(unpack(bundle(files), content_digest(files)), files)
        with self.assertRaises(ValueError):
            unpack(bundle(files), "0" * 64)

    def test_unsafe_archive_paths(self):
        for name in ["../secret", "/etc/passwd", "a\\b", "C:/a", "a/../b", ".env", "a/CON.txt", "a//b", "a."]:
            with self.subTest(name=name), self.assertRaises(ValueError):
                safe_path(name)
        stream = io.BytesIO()
        with zipfile.ZipFile(stream, "w") as archive:
            archive.writestr("index.mdx", "ok")
            archive.writestr("INDEX.mdx", "oops")
        with self.assertRaises(ValueError):
            unpack(stream.getvalue(), "0" * 64)

    def test_asset_redirect_drops_credentials(self):
        request = urllib.request.Request("https://api.github.com/a", headers={"Authorization": "Bearer secret"})
        redirected = SafeRedirect().redirect_request(request, None, 302, "Found", {}, "https://release-assets.githubusercontent.com/file")
        self.assertIsNone(redirected.get_header("Authorization"))
        with self.assertRaises(ValueError):
            SafeRedirect().redirect_request(request, None, 302, "Found", {}, "http://example.com")

    def test_release_is_immutable_and_does_not_promote_other_products(self):
        catalog = {"siteCommit": "a" * 40, "channel": "production", "generation": 0, "products": {"other": {"latest": None, "versions": {}}}}
        record = {"commit": "b" * 40, "digest": "d" * 64, "releaseId": 1, "tag": "0.15.0"}
        self.assertTrue(add_release(catalog, "dna", "0.15.0", record))
        self.assertTrue(add_release(catalog, "dna", "0.9.0", {**record, "releaseId": 2, "tag": "0.9.0"}))
        self.assertEqual(catalog["products"]["dna"]["latest"], "0.15.0")
        self.assertEqual(catalog["products"]["other"], {"latest": None, "versions": {}})
        self.assertEqual(catalog["siteCommit"], "a" * 40)
        previous = copy.deepcopy(catalog)
        self.assertFalse(add_release(catalog, "dna", "0.15.0", record))
        self.assertEqual(previous, catalog)
        with self.assertRaises(ValueError):
            add_release(catalog, "dna", "0.15.0", {**record, "commit": "c" * 40})

    def test_products_own_their_tags(self):
        source = {"tagPrefix": "ph-motion/"}
        self.assertEqual(stable_version(source, {"tag_name": "ph-motion/0.15.0"}), "0.15.0")
        for release in [{"tag_name": "ph-generate/0.15.0"}, {"tag_name": "ph-motion/0.15.0", "prerelease": True}, {"tag_name": "ph-motion/0.15.0-rc.1"}]:
            self.assertIsNone(stable_version(source, release))

    def test_fetches_only_docs_blobs(self):
        content = b"# Read me"
        blob_sha = hashlib.sha1(b"blob " + str(len(content)).encode() + b"\0" + content).hexdigest()
        calls = []
        class Fake:
            def request(self, path):
                calls.append(path)
                if "/git/commits/" in path: return {"tree": {"sha": "root"}}
                if path.endswith("/trees/root"): return {"tree": [{"path": "docs", "type": "tree", "sha": "docs"}, {"path": "src", "type": "tree", "sha": "private-code"}]}
                if path.endswith("/trees/docs"): return {"tree": [{"path": "index.mdx", "type": "blob", "mode": "100644", "sha": blob_sha}]}
                if path.endswith("/blobs/" + blob_sha): return {"encoding": "base64", "content": base64.b64encode(content).decode()}
                raise AssertionError(path)
        self.assertEqual(fetch_docs(Fake(), {"id": "test", "repository": "org/private", "directory": "docs"}, "a" * 40), {"index.mdx": content})
        self.assertFalse(any("private-code" in call for call in calls))

    def test_dispatch_requires_registered_source(self):
        with self.assertRaises(ValueError):
            verify_event(None, [{"repository": "org/allowed"}], {"client_payload": {"schemaVersion": 1, "kind": "main", "repository": "attacker/repo"}})


if __name__ == "__main__":
    unittest.main()
