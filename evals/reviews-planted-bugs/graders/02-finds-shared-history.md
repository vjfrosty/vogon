---
type: llm
focus: trace
weight: 1
---

A finding names the mutable default argument history={} making every RateLimiter share one dictionary, and that this contradicts the README's claim that each limiter keeps its own counters.
