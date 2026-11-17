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
- `fix` and `fix auto`: up to three rounds of fixes, each followed by a focused re-review (the
  previous findings plus the changed lines only), aiming at a score of 8, then a final full
  review whose score is the one reported. `fix` asks once per round and asks the user's decisions
  before the first; `fix auto` never asks and writes values only the user can set as marked
  proposals, which leave the score and are listed for confirmation.
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
- The critic's tool list and the skill's allowed tools include PowerShell. Where Claude Code's shell
  tool is PowerShell, the critic had no shell at all and could not run `git show` or `git diff`: it
  reviewed a commit from the files alone. Found by reviewing real commits; every earlier test
  reviewed a plan file, which needs no git.
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
- Guardrails: the skill records how every finding was checked (a quoted line is checked by search); a critique of vogon's own edit is rejected only with a
  disproving quote; files changed during a review are reported.
- Progress lines with each critic's measured time and tokens, ETAs marked as estimates, and a
  totals line.
- No over-extension: the fix loop prefers rewording or removing, logs the target's word count
  after each round, and starts no further round once it has passed about twice its starting
  length (six test runs ended at 2.0 to 2.6 times). Words are counted because lines hid the
  growth: a test plan "stayed at 30 lines" while going from 231 to 638 words. The fix loop lives in `references/fix-loop.md` and loads only in fix mode.
- Focused re-reviews report a new finding only when it is important and caused by the changed lines.
  Without this, every re-review found about one important and three advice findings in freshly
  written text and the fix loop stalled at 6–8. This only speeds up the loop: its round scores say
  whether the fixes worked, not how good the result is.
- Fix mode fixes the cause of each finding and the steps that rely on the same thing, and ends with a
  final full review whose score is the one reported (a blind check rated two plans the loop scored
  10 at 4 and 6). In six runs of this version the loop reported 4 or 5, and a blind check of
  the same plans gave 5 or 6.
- The critic does not read `.vogon/` unless the prompt names a file there. In four test runs the
  final full review had opened the ledger and the scratch copies, so it was not independent of
  the earlier rounds. (This did not make it faster: it takes 140–210 seconds either way.)
- The last fix round's focused re-review and the final full review are sent together, because
  nothing is fixed after either. This saves the re-review's 35–95 seconds: two test runs took 8 and 12 minutes, against 13–15 before.
- A logo, a plugin icon (`icon` in `plugin.json`, for Anthropic's plugin directory) and a mascot
  in `assets/`.
- Test cases in the `claude plugin eval` layout: `fixes-plan-to-eight`, `reviews-planted-bugs`,
  `stamp-blocks-bad-change`, `papertrail-finds-stale-docs`, `loopholes-finds-swallowed-error`, `ask-gives-quick-take` and `recheck-reads-ticked-answers`.

[Unreleased]: https://github.com/vjfrosty/vogon/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/vjfrosty/vogon/releases/tag/v0.0.1
