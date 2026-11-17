"""Hidden checks for the fix-mode test case: not copied into the workspace.

After a run, from the run's project folder:
    python -m unittest discover -s <this folder> -t <this folder> -p "test_hidden.py"
with the project folder on PYTHONPATH. All three fail on the original rate_limiter.py.
"""
import unittest

from rate_limiter import RateLimiter


class HiddenTest(unittest.TestCase):
    def test_exactly_limit_requests_pass(self):
        limiter = RateLimiter(3, 60)
        self.assertEqual([limiter.allow("exact") for _ in range(4)], [True, True, True, False])

    def test_two_limiters_keep_their_own_history(self):
        search, upload = RateLimiter(2, 60), RateLimiter(2, 60)
        for _ in range(5):
            search.allow("shared")
        self.assertTrue(upload.allow("shared"))

    def test_reset_of_an_unknown_client_does_not_raise(self):
        RateLimiter(1, 60).reset("never-seen")


if __name__ == "__main__":
    unittest.main()
