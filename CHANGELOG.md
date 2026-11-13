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
- `stamp` (also `gate`, `verdict`, `inspect`, `audit`): a full review that starts with
  `APPROVED` (score 8 or more, nothing important open) or `DEMOLISHED` with the blocking findings.
- Lenses, combinable with any mode: `papertrail` (also `docs`, `comments`) checks docs, comments,
  examples and rules files against the code first; `loopholes` (also `edges`, `errors`, `holes`)
  checks error handling and edge cases first. A lens never hides an important finding elsewhere.
- One command, `/vogon:vogon`, with an `argument-hint` so the `/` menu lists every mode and lens.
- `ask` (also `quick`): a quick take, the critic's top five findings with no verification, ledger or score.
- `recheck` (also `again`): one focused re-review of an earlier ledger after the user acted on it.
- Every ledger ends with a `## To do` checklist of questions and proposals; `recheck` reads ticked
  items as the user's answers.
- No command needed: Claude offers the skill when asked in plain words ("poke holes in",
  "second opinion", "is this ready for a PR?", "can I merge this?", "rate this 1 to 10") and
  picks the mode from them. Tested on 22 requests, at least twice each: it never picked the skill
  for the 11 near-misses.
- `critic` agent (`vogon:critic`): the reviewer on its own, read-only by its tool list, usable
  directly ("ask the critic…") and from other skills and workflows.
- The critic runs on the user's own model by default; `model: opus | sonnet | haiku | fable`
  chooses another.
- Settled decisions are collected from the `settled:` argument, the project's Claude memory
  and `docs/decisions` / `adr/` folders, and are never raised again.
- The critic reports rules files and registries that the change leaves stale.
- Ledgers are saved in the project's `.vogon/` folder, which ignores itself in git through its
  own `.gitignore`; a second run the same day gets `-2`, `-3`. A PreToolUse hook allows writes
  inside that folder without a permission prompt, refuses a write over an existing ledger, and
  leaves every other write to the user's rules.
- When Claude starts the skill from the user's own words (no `/vogon` and no mention of vogon),
  it asks once before any critic runs: run it, a quick take instead, or answer normally. The
  `critic` agent starts only when the user names it or another skill calls it.
- Guardrails: the critic quotes the line each finding points at, and the skill checks the quote and
  records how every finding was checked; a critique of vogon's own edit is rejected only with a
  disproving quote; files changed during a review are reported.
- Progress lines with each critic's measured time and tokens, ETAs marked as estimates, and a
  totals line.
- No over-extension: the fix loop prefers rewording or removing, logs lines added and removed per
  round, and stops if a round grows the target by more than about a fifth; the critic reports
  bloat as `simplify`. The fix loop lives in `references/fix-loop.md` and loads only in fix mode.
- A logo, a plugin icon (`icon` in `plugin.json`, for Anthropic's plugin directory) and a mascot
  in `assets/`.
- Test cases in the `claude plugin eval` layout: `fixes-plan-to-eight`, `reviews-planted-bugs`,
  `stamp-blocks-bad-change`, `papertrail-finds-stale-docs`, `loopholes-finds-swallowed-error`, `ask-gives-quick-take` and `recheck-reads-ticked-answers`.

[Unreleased]: https://github.com/vjfrosty/vogon/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/vjfrosty/vogon/releases/tag/v0.0.1
