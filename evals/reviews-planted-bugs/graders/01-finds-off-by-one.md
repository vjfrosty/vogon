---
type: llm
focus: trace
weight: 1
---

A finding names the off-by-one in allow(): the check len(calls) > self.limit lets limit + 1 requests through in a window, with rate_limiter.py line evidence.
