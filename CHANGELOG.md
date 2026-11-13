# Changelog

All notable changes are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.0.1] - 2026-11-13

First release, as a Claude Code plugin with one skill and one agent.

- `vogon` skill: an independent critic reviews a plan, design doc, proposal, commit range,
  uncommitted changes, a task in progress or a topic. Every finding has an id, a severity
  (`important`, `advice`, `info`), evidence and a mechanism; findings without them are dropped
  and counted.
- Each finding is checked against the code before it is shown and gets one verdict: `fix`,
  `needs-you`, `taste`, `wrong` or `settled`. `info` findings carry no verdict.
- A score from 1 to 10 by a fixed rule: no `important` open → 10 minus `advice` (lowest 5);
  `important` open → 6 minus the extra ones (lowest 1).
- `fix` and `fix auto`: up to three rounds of minimal fixes, each followed by a focused
  re-review (the previous findings plus the changed lines only), until the score reaches 8.
  `fix` asks once per round; `fix auto` never asks and writes values only the user can set as
  marked proposals, which leave the score and are listed for confirmation.
- `ask`: a quick take, the critic's top five findings with no verification, ledger or score.
- `recheck`: one focused re-review of an earlier ledger after the user acted on it.
- No command needed: Claude starts the skill when asked in plain words ("poke holes in",
  "second opinion", "is this ready for a PR?", "rate this 1 to 10") and picks the mode from them.
  Tested on 16 requests, twice each: it started on all 8 critique requests and on none of the
  8 near-misses.
- `critic` agent (`vogon:critic`): the reviewer on its own, read-only by its tool list, usable
  directly ("ask the critic…") and from other skills and workflows.
- The critic runs on the user's own model by default; `model: opus | sonnet | haiku | fable`
  chooses another.
- Settled decisions are collected from the `settled:` argument, the project's Claude memory
  and `docs/decisions` / `adr/` folders, and are never raised again.
- The critic reports rules files and registries that the change leaves stale.
- Ledgers are saved in the project's `.vogon/` folder, which ignores itself in git through its
  own `.gitignore`; a second run the same day gets `-2`, `-3`. A PreToolUse hook allows writes
  inside that folder without a permission prompt and leaves every other write to the user's rules.
- Test cases in the `claude plugin eval` layout: `evals/fixes-plan-to-eight` and
  `evals/reviews-planted-bugs`.

[Unreleased]: https://github.com/vjfrosty/critique-skill/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/vjfrosty/critique-skill/releases/tag/v0.0.1
