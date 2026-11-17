import unittest

from rate_limiter import RateLimiter


class RateLimiterTest(unittest.TestCase):
    def test_first_request_is_allowed(self):
        self.assertTrue(RateLimiter(3, 60).allow("first"))

    def test_a_client_far_over_the_limit_is_refused(self):
        limiter = RateLimiter(3, 60)
        results = [limiter.allow("busy") for _ in range(10)]
        self.assertFalse(results[-1])

    def test_one_client_does_not_use_up_another(self):
        limiter = RateLimiter(1, 60)
        for _ in range(5):
            limiter.allow("loud")
        self.assertTrue(limiter.allow("quiet"))

    def test_reset_lets_a_known_client_in_again(self):
        limiter = RateLimiter(1, 60)
        for _ in range(5):
            limiter.allow("again")
        limiter.reset("again")
        self.assertTrue(limiter.allow("again"))


if __name__ == "__main__":
    unittest.main()
