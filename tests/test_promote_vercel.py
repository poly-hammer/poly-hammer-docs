import unittest

from scripts.promote_vercel import promote


class FakeVercel:
    def __init__(self):
        self.project = {"id": "prj_test", "accountId": "team_test"}
        self.deployment = {"id": "dpl_test", "projectId": "prj_test", "ownerId": "team_test",
                           "url": "immutable.vercel.app", "readyState": "READY", "target": "production"}
        self.alias = {"alias": "staging.vercel.app", "deploymentId": "dpl_test", "projectId": "prj_test"}
        self.polls = []
        self.calls = []
        self.extra_aliases = {}

    def request(self, path, method="GET"):
        self.calls.append((path, method))
        if method == "POST":
            return {}
        if path.startswith("/v13/deployments/"):
            return self.deployment
        if path.startswith("/v4/aliases/"):
            return self.extra_aliases.get(path.rsplit("/", 1)[-1], self.alias)
        if len(self.calls) == 1:
            return self.project
        return self.polls.pop(0)


class PromotionTests(unittest.TestCase):
    def run_promotion(self, api, **kwargs):
        promote(api, "prj_test", "team_test", "https://immutable.vercel.app",
                "https://staging.vercel.app", sleep=lambda _: None, **kwargs)

    def test_waits_for_project_and_hostname_to_serve_tested_deployment(self):
        api = FakeVercel()
        api.polls = [{"targets": {"production": {"id": "dpl_old"}}},
                     {"targets": {"production": {"id": "dpl_test"}}}]
        self.run_promotion(api)
        self.assertEqual([call for call in api.calls if call[1] == "POST"],
                         [("/v10/projects/prj_test/promote/dpl_test", "POST")])
        self.assertEqual(api.calls[-1], ("/v4/aliases/staging.vercel.app", "GET"))

    def test_refuses_wrong_project_team_unready_or_preview_before_mutation(self):
        for field, value in [("projectId", "prj_other"), ("ownerId", "team_other"),
                             ("readyState", "BUILDING"), ("target", "preview")]:
            with self.subTest(field=field):
                api = FakeVercel()
                api.deployment[field] = value
                with self.assertRaises(ValueError):
                    self.run_promotion(api)
                self.assertFalse(any(method == "POST" for _, method in api.calls))
        api = FakeVercel()
        api.project["accountId"] = "team_other"
        with self.assertRaises(ValueError):
            self.run_promotion(api)
        self.assertEqual(len(api.calls), 1)

    def test_failed_promotion_is_not_recorded_as_success(self):
        api = FakeVercel()
        api.polls = [{"lastAliasRequest": {"toDeploymentId": "dpl_test", "jobStatus": "failed"}}]
        with self.assertRaisesRegex(RuntimeError, "failed hostname promotion"):
            self.run_promotion(api)

    def test_pre_cutover_alias_must_target_the_same_project_and_deployment(self):
        for wrong_field in [None, "projectId", "deploymentId"]:
            with self.subTest(wrong_field=wrong_field):
                api = FakeVercel()
                api.polls = [{"targets": {"production": {"id": "dpl_test"}}}]
                alias = {**api.alias, "alias": "production.vercel.app"}
                if wrong_field:
                    alias[wrong_field] = "wrong"
                api.extra_aliases["production.vercel.app"] = alias
                ticks = iter([0, 0, 181])
                options = {"verification_url": "https://production.vercel.app", "clock": lambda: next(ticks)}
                if wrong_field:
                    with self.assertRaises(TimeoutError):
                        self.run_promotion(api, **options)
                else:
                    self.run_promotion(api, **options)
                self.assertIn(("/v4/aliases/production.vercel.app", "GET"), api.calls)

    def test_arbitrary_verification_hosts_are_rejected_before_mutation(self):
        api = FakeVercel()
        with self.assertRaises(ValueError):
            self.run_promotion(api, verification_url="https://external.example.com")
        self.assertEqual(api.calls, [])

    def test_stale_hostname_times_out_even_when_project_target_is_updated(self):
        api = FakeVercel()
        api.polls = [{"targets": {"production": {"id": "dpl_test"}}}]
        api.alias["deploymentId"] = "dpl_old"
        ticks = iter([0, 0, 181])
        with self.assertRaises(TimeoutError):
            self.run_promotion(api, clock=lambda: next(ticks))


if __name__ == "__main__":
    unittest.main()
