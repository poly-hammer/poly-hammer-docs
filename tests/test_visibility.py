import copy
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from visibility import hidden_paths, set_visibility, visible
from sync_catalog import identity, reconcile_staging


class VisibilityTests(unittest.TestCase):
    def test_defaults_and_explicit_enable(self):
        self.assertEqual(hidden_paths("production"), ["blender-addons/ph-motion", "cli"])
        self.assertEqual(hidden_paths("staging"), [])
        self.assertEqual(hidden_paths("production", "[]"), [])
        for value in ['"cli"', '["/cli"]', '["../cli"]', '[false]']:
            with self.assertRaises(ValueError):
                hidden_paths("production", value)
        self.assertFalse(visible("blender-addons/ph-motion", hidden_paths("production")))
        self.assertTrue(visible("blender-addons/ph-motion-extra", hidden_paths("production")))

    def test_policy_changes_trigger_deployment_without_replacing_release_history(self):
        catalog = {"generation": 2, "products": {"motion": {"versions": {"1.0.0": {"commit": "a"}}}}}
        previous = copy.deepcopy(catalog)
        set_visibility(catalog, ["cli"])
        self.assertNotEqual(identity(catalog), identity(previous))
        self.assertEqual(catalog["products"], previous["products"])
        self.assertEqual(catalog["generation"], 3)
        set_visibility(catalog, ["cli"])
        self.assertEqual(catalog["generation"], 3)

    def test_staging_visibility_is_independent_and_idempotent(self):
        production = {"generation": 1, "products": {}, "siteCommit": "a", "channel": "production", "hiddenPaths": ["cli"]}
        previous = {**production, "channel": "staging", "hiddenPaths": []}
        staged = reconcile_staging(previous, production, [], None, None, "archive", "a", [])
        self.assertEqual(staged, previous)
