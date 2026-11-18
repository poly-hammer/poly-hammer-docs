import json
from pathlib import Path
import sys
import tarfile
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from package_vercel import package


class PrebuiltArtifactTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.config = self.root / ".vercel/output/functions/page.func/.vc-config.json"
        self.config.parent.mkdir(parents=True)
        (self.root / ".vercel/output/config.json").write_text('{"version":3}')

    def test_fresh_deploy_workspace_has_output_and_every_mapped_source(self):
        files = {"node_modules/client-only/index.js": "runtime dependency", ".next/server/page.js": "compiled page"}
        for relative, content in files.items():
            path = self.root / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content)
        mapping = {"renamed-runtime.js": "node_modules/client-only/index.js", "page.js": ".next/server/page.js"}
        self.config.write_text(json.dumps({"filePathMap": mapping}))
        (self.root / ".vercel/.env.production.local").write_text("MUST_NOT_TRANSFER=sentinel")
        (self.root / ".vercel/project.json").write_text("settings transferred separately")
        archive_path = self.root / "artifact.tar.gz"
        self.assertEqual(package(self.root, archive_path), 2)
        fresh = self.root / "fresh-runner"
        with tarfile.open(archive_path) as archive:
            archive.extractall(fresh, filter="data")
        config = json.loads((fresh / self.config.relative_to(self.root)).read_text())
        for relative in config["filePathMap"].values():
            self.assertEqual((fresh / relative).read_text(), files[relative])
        self.assertFalse((fresh / ".vercel/.env.production.local").exists())
        self.assertFalse((fresh / ".vercel/project.json").exists())

    def test_missing_dependency_fails_during_build_packaging(self):
        self.config.write_text(json.dumps({"filePathMap": {"runtime.js": "node_modules/missing.js"}}))
        with self.assertRaises(FileNotFoundError):
            package(self.root, self.root / "artifact.tar.gz")

    def test_only_traced_runtime_roots_are_permitted(self):
        for value in ["../outside", "node_modules/../../.env", ".env.local", ".git/config", "/absolute", "node_modules\\file.js"]:
            with self.subTest(value=value):
                self.config.write_text(json.dumps({"filePathMap": {"runtime.js": value}}))
                with self.assertRaises(ValueError):
                    package(self.root, self.root / "artifact.tar.gz")


if __name__ == "__main__":
    unittest.main()
