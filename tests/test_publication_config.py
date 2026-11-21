import unittest

from scripts.check_publication_config import validate


class PublicationConfigTests(unittest.TestCase):
    def settings(self, channel="production"):
        return {
            "DOCS_CHANNEL": channel, "GITHUB_REF": "refs/heads/main",
            "VERCEL_ORG_ID": "team_test", "DOCS_PRODUCTION_ENABLED": "true",
            "VERCEL_STAGING_PROJECT_ID": "prj_staging",
            "VERCEL_PRODUCTION_PROJECT_ID": "prj_production",
            "DOCS_STAGING_URL": "https://staging.example.com",
            "DOCS_PRODUCTION_URL": "https://docs.example.com",
            "VERCEL_PROJECT_ID": f"prj_{channel}",
            "DOCS_SITE_URL": "https://docs.example.com" if channel == "production" else "https://staging.example.com",
        }

    def test_separate_channels_are_valid(self):
        validate(self.settings())
        staging = self.settings("staging")
        staging["DOCS_PRODUCTION_ENABLED"] = "false"
        staging.pop("VERCEL_PRODUCTION_PROJECT_ID")
        staging.pop("DOCS_PRODUCTION_URL")
        validate(staging)

    def test_missing_production_settings_cannot_fall_back_to_staging(self):
        for expected, resolved, fallback in [
            ("VERCEL_PRODUCTION_PROJECT_ID", "VERCEL_PROJECT_ID", "VERCEL_STAGING_PROJECT_ID"),
            ("DOCS_PRODUCTION_URL", "DOCS_SITE_URL", "DOCS_STAGING_URL"),
        ]:
            with self.subTest(expected=expected):
                env = self.settings()
                env[expected] = ""
                env[resolved] = env[fallback]
                with self.assertRaises(ValueError):
                    validate(env)

    def test_shared_project_or_hostname_is_rejected(self):
        for setting, resolved, staging in [
            ("VERCEL_PRODUCTION_PROJECT_ID", "VERCEL_PROJECT_ID", "VERCEL_STAGING_PROJECT_ID"),
            ("DOCS_PRODUCTION_URL", "DOCS_SITE_URL", "DOCS_STAGING_URL"),
        ]:
            with self.subTest(setting=setting):
                env = self.settings()
                env[setting] = env[resolved] = env[staging]
                with self.assertRaisesRegex(ValueError, "separate"):
                    validate(env)

    def test_disabled_production_untrusted_ref_and_invalid_origins_are_rejected(self):
        cases = [("DOCS_PRODUCTION_ENABLED", "false"), ("GITHUB_REF", "refs/heads/feature"),
                 ("DOCS_CHANNEL", "preview"), ("VERCEL_ORG_ID", ""),
                 ("DOCS_PRODUCTION_URL", "https://docs.example.com/"),
                 ("DOCS_PRODUCTION_URL", "http://docs.example.com"),
                 ("DOCS_PRODUCTION_URL", "https://user:secret@docs.example.com")]
        for key, value in cases:
            with self.subTest(key=key, value=value):
                with self.assertRaises(ValueError):
                    validate({**self.settings(), key: value})


if __name__ == "__main__":
    unittest.main()
