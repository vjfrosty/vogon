# api-limits

Rate limiting for the public API.

- `RateLimiter(limit, window)` allows at most `limit` requests per client in any `window` seconds.
- Each `RateLimiter` keeps its own counters, so the search API and the upload API can have different limits without affecting each other.
- `reset(client_id)` clears a client's counters; it is safe to call for a client that has never made a request.
- Memory use stays flat: clients that stop calling are forgotten after one window.
