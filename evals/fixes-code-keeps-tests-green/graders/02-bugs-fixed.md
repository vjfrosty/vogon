---
type: llm
focus: trace
weight: 1
---

The edited rate_limiter.py no longer lets limit+1 requests through, no longer shares one history between RateLimiter instances through a mutable default argument, and reset() no longer raises for a client that never made a request.
