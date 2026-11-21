from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from check_vercel_access import check


class ReadOnlyVercel:
    def __init__(self, **overrides):
        self.calls = []
        self.project = {"id": "prj_production", "accountId": "team_test", "framework": "nextjs",
                        "nodeVersion": "24.x", "ssoProtection": {"deploymentType": "all"}, **overrides}

    def request(self, path):
        self.calls.append(path)
        return self.project


class AccessTests(unittest.TestCase):
    def test_only_reads_the_explicit_project(self):
        api = ReadOnlyVercel()
        check(api, "team_test", "prj_production", "test-only")
        self.assertEqual(api.calls, ["/v9/projects/prj_production"])

    def test_rejects_missing_bypass_and_misconfigured_project(self):
        api = ReadOnlyVercel()
        with self.assertRaisesRegex(ValueError, "BYPASS"):
            check(api, "team_test", "prj_production", "")
        self.assertEqual(api.calls, [])
        for overrides in [{"id": "prj_wrong"}, {"accountId": "team_wrong"},
                          {"framework": "other"}, {"nodeVersion": "26.x"},
                          {"link": {"type": "github"}}, {"ssoProtection": None}]:
            with self.subTest(overrides=overrides), self.assertRaises(ValueError):
                check(ReadOnlyVercel(**overrides), "team_test", "prj_production", "test-only")
