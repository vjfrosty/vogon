---
type: llm
focus: trace
weight: 1
---

A finding names the 'while True' retry in fetch_page(): no bound and no backoff, so an outage loops forever, with sync.py line evidence.
