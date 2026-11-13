# Changelog

All notable changes are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.0] - 2026-11-13

- No slash needed: Claude starts the skill when you ask in your own words ("poke holes in",
  "second opinion", "is this ready for a PR?", "rate this 1 to 10", "devil's advocate") and picks
  the mode from them. Tested on 16 requests, twice each: it started on all 8 critique requests
  and on none of the 8 near-misses.
- `ask` mode: a quick take, the critic's top five findings with no verification, ledger or score.
- `model:` option: `opus` (default), `sonnet`, `haiku`, or `session` to run the critic on the
  session's model.
- README: install commands that work on Windows, where Git Bash's `~` can point to a network
  home drive instead of the folder Claude Code reads.

## [0.1.0] - 2026-11-13

- `/critique <target>`: one fresh Claude Opus critic reviews a plan, design doc, proposal,
  commit range, uncommitted changes, a task in progress or a topic. Every finding has an id,
  a severity (`important`, `advice`, `info`), evidence and a mechanism; findings without them
  are dropped and counted.
- Each finding is checked against the code before it is shown and gets one verdict: `fix`,
  `needs-you`, `taste`, `wrong` or `settled`. `info` findings carry no verdict.
- A score from 1 to 10 by a fixed rule: no `important` open → 10 minus `advice` (lowest 5);
  `important` open → 6 minus the extra ones (lowest 1).
- `/critique fix` and `/critique fix auto`: up to three rounds of minimal fixes, each followed
  by a focused re-review (the previous findings plus the changed lines only), until the score
  reaches 8. `fix` asks once per round; `fix auto` never asks and writes values only the user
  can set as marked proposals, which leave the score and are listed for confirmation.
- `/critique recheck`: one focused re-review of an earlier ledger after the user acted on it.
- Ledgers never overwrite each other: a second run on the same day gets `-2`, `-3`.
- Settled decisions are collected from the `settled:` argument, the project's Claude memory
  and `docs/decisions` / `adr/` folders, and are never raised again.
- The critic reports rules files and registries that the change leaves stale.
- Ledgers are archived under `~/.claude/skills/critique/runs/<project>/`, outside the
  repository under review.
- Test cases in the `claude plugin eval` layout: `evals/fixes-plan-to-eight` (the fix loop on a
  flawed deploy plan) and `evals/reviews-planted-bugs` (a review of a module with four planted bugs).

[Unreleased]: https://github.com/vjfrosty/critique-skill/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/vjfrosty/critique-skill/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/vjfrosty/critique-skill/releases/tag/v0.1.0
