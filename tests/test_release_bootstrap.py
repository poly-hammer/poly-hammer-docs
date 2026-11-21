import copy
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from docs_pipeline import add_release
from sync_catalog import reconcile_production, validate_bootstraps

SOURCE = {"id": "dna", "repository": "owner/dna", "branch": "main", "tagPrefix": ""}
SEED = {"tag": "0.15.1", "releaseId": 15, "releaseCommit": "a" * 40, "docsCommit": "b" * 40,
        "approvedAt": "2026-11-21T13:45:20Z", "reason": "Owner-approved initial main snapshot."}
RELEASE = {"id": 15, "tag_name": "0.15.1", "published_at": "2026-11-17T03:00:38Z"}


class Reader:
    def __init__(self):
        self.releases = [RELEASE, {**RELEASE, "id": 14, "tag_name": "0.14.5"}]
        self.commits = {"0.15.1": "a" * 40, "main": "b" * 40, "0.16.0": "c" * 40}
        self.comparison = "identical"
        self.calls = []

    def pages(self, path):
        return iter(self.releases)

    def request(self, path):
        self.calls.append(path)
        if "/compare/" in path:
            return {"status": self.comparison}
        return {"sha": self.commits[path.rsplit("/", 1)[-1]]}


class BootstrapTests(unittest.TestCase):
    def setUp(self):
        self.catalog = {"schemaVersion": 1, "channel": "production", "siteCommit": "d" * 40,
                        "generation": 0, "products": {}}
        self.reader = Reader()
        self.exclusions = {"dna:0.14.5": "Owner requested current release only."}

    def reconcile(self, catalog=None, seed=None):
        def snapshot(reader, archiver, archive, source, commit, version, published, release):
            return {"commit": commit, "digest": "e" * 64, "archive": "test:1", "revision": 1,
                    "publishedAt": published, "releaseId": release["id"], "tag": release["tag_name"]}
        with patch("sync_catalog.snapshot", side_effect=snapshot) as capture:
            result = reconcile_production(copy.deepcopy(catalog or self.catalog), [SOURCE], self.exclusions,
                                          self.reader, None, "test", {"dna": seed or SEED})
        return result, capture

    def test_first_release_uses_pinned_main_and_preserves_release_identity(self):
        catalog, capture = self.reconcile()
        product = catalog["products"]["dna"]
        self.assertEqual(list(product["versions"]), ["0.15.1"])
        self.assertEqual(product["latest"], "0.15.1")
        record = product["versions"]["0.15.1"]
        self.assertEqual(record["commit"], SEED["docsCommit"])
        self.assertEqual(record["releaseCommit"], SEED["releaseCommit"])
        self.assertEqual(record["bootstrap"]["kind"], "initial-main")
        self.assertEqual(capture.call_count, 1)
        self.assertFalse(any("0.14.5" in call for call in self.reader.calls))

    def test_retry_and_main_changes_do_not_replace_baseline(self):
        catalog, _ = self.reconcile()
        self.reader.commits["main"] = "f" * 40
        again, capture = self.reconcile(catalog)
        self.assertEqual(again, catalog)
        capture.assert_not_called()

    def test_future_release_uses_tag_not_current_main(self):
        catalog, _ = self.reconcile()
        self.reader.commits["main"] = "f" * 40
        self.reader.releases.insert(0, {**RELEASE, "id": 16, "tag_name": "0.16.0"})
        updated, capture = self.reconcile(catalog)
        record = updated["products"]["dna"]["versions"]["0.16.0"]
        self.assertEqual(record["commit"], "c" * 40)
        self.assertNotIn("bootstrap", record)
        self.assertEqual(updated["products"]["dna"]["versions"]["0.15.1"], catalog["products"]["dna"]["versions"]["0.15.1"])
        self.assertEqual(updated["siteCommit"], catalog["siteCommit"])
        self.assertEqual(capture.call_count, 1)

    def test_moved_tag_recreated_release_and_changed_bootstrap_are_rejected(self):
        catalog, _ = self.reconcile()
        self.reader.commits["0.15.1"] = "f" * 40
        with self.assertRaisesRegex(ValueError, "identity changed"):
            self.reconcile(catalog)
        self.reader = Reader()
        self.reader.releases[0] = {**RELEASE, "id": 99}
        with self.assertRaisesRegex(ValueError, "identity changed"):
            self.reconcile(catalog)
        self.reader = Reader()
        with self.assertRaisesRegex(ValueError, "cannot be replaced"):
            self.reconcile(catalog, {**SEED, "docsCommit": "f" * 40})
        record = catalog["products"]["dna"]["versions"]["0.15.1"]
        with self.assertRaisesRegex(ValueError, "identity changed"):
            add_release(catalog, "dna", "0.15.1", {**record, "releaseCommit": "f" * 40})

    def test_unavailable_baseline_and_docs_commit_outside_main_are_rejected(self):
        self.reader.releases = []
        with self.assertRaisesRegex(ValueError, "unavailable"):
            self.reconcile()
        self.reader = Reader()
        self.reader.comparison = "diverged"
        with self.assertRaisesRegex(ValueError, "must already be on"):
            self.reconcile()

    def test_bootstrap_manifest_is_explicit_and_cannot_overlap_exclusions(self):
        manifest = {"schemaVersion": 1, "products": {"dna": SEED}}
        self.assertEqual(validate_bootstraps(manifest, [SOURCE], self.exclusions), {"dna": SEED})
        for override in [{"docsCommit": "main"}, {"releaseId": True}, {"reason": ""},
                         {"tag": "0.16.0-beta.1"}, {"approvedAt": "yesterday"}]:
            with self.subTest(override=override), self.assertRaises(ValueError):
                validate_bootstraps({**manifest, "products": {"dna": {**SEED, **override}}}, [SOURCE], {})
        with self.assertRaisesRegex(ValueError, "also be excluded"):
            validate_bootstraps(manifest, [SOURCE], {"dna:0.15.1": "excluded"})
