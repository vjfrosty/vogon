"""A sliding-window rate limiter for the public API.

Each client may make at most `limit` requests in any `window` seconds.
Used by the request middleware: `if not limiter.allow(client_id): return 429`.
"""

import time


class RateLimiter:
    def __init__(self, limit, window, history={}):
        self.limit = limit
        self.window = window
        self.history = history

    def allow(self, client_id):
        now = time.time()
        calls = self.history.get(client_id, [])
        # forget calls that have left the window
        calls = [t for t in calls if now - t < self.window]
        if len(calls) > self.limit:
            return False
        calls.append(now)
        self.history[client_id] = calls
        return True

    def reset(self, client_id):
        del self.history[client_id]
