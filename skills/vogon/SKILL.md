---
name: vogon
description: Use when the user wants a critique, second opinion, devil's advocate or skeptical review of a plan, design doc, proposal, decision, commit, diff, documentation or work in progress; asks "what's wrong with this", to "poke holes in", "tear apart" or "sanity-check" it; asks to score, rate or grade it; asks "is this ready", "can I merge / ship this" or wants an approve-or-block verdict; asks "are the docs still right", "do the comments match the code", "what edge cases did I miss" or "check the error handling" about existing work; asks to fix something "until it passes"; or mentions vogon ("vogon this", "run vogon on"). Not for routine edits, explaining code, or a review the user asked to do with another named tool.
argument-hint: "[stamp | papertrail | loopholes | ask | fix | fix auto | recheck] <target>"
allowed-tools: Agent, Read, Grep, Glob, Bash, Edit, Write
---

# Vogon

A fresh critic, on the user's own model unless they name another, reviews the target without this conversation's reasoning. You verify what it says, score the target 1–10 from the verified findings, and hand the user a ledger. `fix` also fixes what is yours to fix and loops until the score reaches 8; `stamp` ends in APPROVED or DEMOLISHED; `ask` only passes on the critic's answer.

**Arguments:** `$ARGUMENTS`

## Modes, lenses and words

Read the words from the arguments, or from the user's own sentence when there is no slash. One mode, any lenses, then the target. Nothing matches → review.

| Word | Also accept | Plain phrases | What happens |
|---|---|---|---|
| *(none)* | `review`, `critique` | "critique", "second opinion", "score / rate / grade it", "is this ready" | review: steps 1–5 |
| `stamp` | `gate`, `verdict`, `inspect`, `audit` | "can I merge / ship this", "approve or block", "is this good to go" | review + APPROVED / DEMOLISHED (step 6) |
| `ask` | `quick` | "quick take", "what would a critic say", "poke holes in", "devil's advocate" | the critic's answer only (step 9) |
| `fix` | | "fix it until it passes / scores 8", "critique and fix" | review, then the fix loop (step 7) |
| `fix auto` | `fix --auto` | the same plus "automatically", "without asking" | the loop without asking |
| `recheck` | `again` | "check again", "did I fix it" after a ledger | one focused re-review (step 8) |
| lens `papertrail` | `docs`, `comments` | "are the docs still right", "do the comments match the code" | the critic weighs docs vs. code first |
| lens `loopholes` | `edges`, `errors`, `holes` | "check the error handling", "what edge cases did I miss" | the critic weighs failure paths first |

A lens combines with any mode (`/vogon:vogon fix loopholes src/`). Options anywhere: `focus: <what to weigh first>`, `settled: <decisions the critic must not raise>`, `model: <session | opus | sonnet | haiku | fable>` (default `session`: this conversation's model; "use Opus" means the same).

## 0. Confirm when you started it yourself

If the user's latest message starts with `/vogon` or names vogon, go on. Otherwise you chose this skill from their words: resolve the target (step 1), then ask once with AskUserQuestion before any critic runs — `Run vogon <mode> [lens] on <target>?` — with **Run it**, **Quick take instead** (`ask`) and **No, answer normally**; for `fix`, say it can take up to 3 rounds. On **No**, answer without the skill. Without AskUserQuestion (a headless run), do not start: begin the reply with `Run /vogon:vogon <mode> <target> to review this.` and answer normally.

## Progress and cost

The user sees nothing while a critic works. Print one `vogon:` line before the first critic (`critic on <model>, ETA ~1–2 min (estimate)`) and one after each critic: its time and tokens from the `<usage>` line of the Agent result, the score, and the next step with an ETA marked `(estimate)`. End the reply, and the ledger, with `Total: <n> critic runs, <sum>k critic tokens, <wall time>. Your session's own tokens: /cost` — you cannot see your own tokens, so do not guess them.

Send reads, searches and edits that do not depend on each other together in one message; each separate step costs a full model turn.

## 1. Resolve the target

| The user says | Target becomes |
|---|---|
| a path, directory, or commit range | as given |
| "my changes", "what I did", "the diff" | `git diff` + `git diff --cached` + untracked files; if clean, the branch against its base (`git log main..HEAD`) |
| "the plan", "the design", "the spec" | the plan discussed in this conversation; else the newest of `~/.claude/plans/*.md`, `docs/plans`, `docs/execplans`, `plans/`, `.design/` |
| a task, ticket or PR id | its description plus the work done for it so far |
| a topic ("the retry logic") | the files Grep/Glob find for it |

Half-done work is reviewed as half-done: tell the critic what is finished and what is still planned. Still ambiguous → ask, because a review of the wrong target wastes a critic run and reads as a verdict on work the user did not mean.

In review, `stamp` and `ask` mode inside a git repository, take `git status --porcelain` with the start-up reads and again before replying; if it changed, say `Files changed during the review (by vogon or anything else): <paths>`.

## 2. Gather the settled list

Decisions the critic must not re-raise, one bullet each with its source; skip what doesn't exist: the `settled:` argument and anything settled in this conversation; lines in the project's memory index (`MEMORY.md` under `~/.claude/projects/<project>/memory/`) saying settled, decided, resolved or don't re-raise; titles in `docs/decisions`, `docs/adr`, `adr/` or `decisions/` that touch the target.

## 3. Spawn the critic

One Agent call with `subagent_type: "vogon:critic"`. Pass `model` only when the user named one, and use the same model for every critic in the run. If that agent is missing (skill installed without the plugin), use `general-purpose` and put the body of `${CLAUDE_PLUGIN_ROOT}/agents/critic.md` (in a manual install, `../../agents/critic.md` from this skill's folder) at the top of the prompt.

```
Review target: <target>
State: <"finished" | "in progress: done = …, still planned = …">
Lens: <papertrail | loopholes | papertrail, loopholes | none>
Focus (weigh first): <focus or "none">
Settled — do not raise these, they are decided:
<settled list, or "none">
```

### Focused re-review (fix rounds and `recheck`)

A fresh critic that reads everything again finds new faults in text the fixes wrote, and each round costs as much as the first. So append:

```
Focused re-review. Do not review the whole target again.
1. For each previous finding, answer resolved / still-open (why) / made-worse (why):
<id | severity | finding>
2. Report new findings only inside these changed lines, or that these changes cause elsewhere:
<unified diff of the target since the previous review>
```

For the diff, copy each target file into `.vogon/.tmp/` before fixing (with Write or the shell's own copy; the shell may be bash or PowerShell) and run `git diff --no-index .vogon/.tmp/<file> <file>`, which works anywhere git is installed. For code under git, `git diff` since the recorded commit is enough. Delete `.vogon/.tmp/` when the run ends.

## 4. Validate, triage, score

Drop a finding that lacks an id, a severity, evidence or a mechanism, and count the dropped. Verify every claim yourself and note how in a `checked` column: when the finding has a `Quote:` line, Grep for it in the cited file (`checked: quote matches store.py:34`), otherwise Read / Grep / git (`checked: Read client.py:15-26`). A quote that does not match only means checking the usual way; it is never a reason to drop a finding.

| Verdict | Meaning |
|---|---|
| `fix` | Real, verified, concrete benefit. Say if small enough to do now. |
| `needs-you` | Only the user can decide (a fact, a cost, a product or contract choice). One line: what to decide. |
| `taste` | Could go either way. One line: the trade-off. |
| `wrong` | The critic is mistaken: what is true and how you checked. Unchecked disagreement is `wrong (unverified)`. |
| `settled` | Re-opens an item on the settled list. Name the source. |

Every `important` finding ends as `fix`, `needs-you`, `wrong` or `settled`. `info` gets no verdict (`—`). In fix rounds you are judging critiques of text you wrote, where a model most wants to defend its own work: a finding about lines you changed is `wrong` only with a quote that shows it is false.

**Score (1–10)** from the verified findings still open (`wrong`, `settled`, `info` and findings answered by a marked proposal do not count):
- no `important` open: **10 − number of `advice`**, floor 5;
- `important` open: **6 − (number of `important` − 1)**, floor 1.

So 8 means: nothing important, at most two advice. Show the critic's own score beside yours; when they differ by 2 or more, say why in one line.

## 5. Archive and reply

Write the ledger to `.vogon/<YYYY-MM-DD>-<slug>.md` in the project root (slug: the target's file name or a few words; if taken, `-2`, `-3`; the plugin's hook refuses to overwrite a ledger, so later rounds are appended with Edit). The first time, also write `.vogon/.gitignore` containing `*`; leave the user's own `.gitignore` and `.git/` alone. Contents: target, lens, focus, settled list, the critic's model, time, tokens and `agentId` (its full answer stays in the session's `subagents/agent-<agentId>.jsonl` under `~/.claude/projects/` until Claude Code cleans it up), the critic's `What looks good` bullets, the table `id | severity | verdict | finding | evidence | checked`, the score, the totals line, and last:

```
## To do
- [ ] c3 — <the needs-you question>
- [ ] proposal — <value written as "(proposed — confirm)", where>
```

Reply with: `Ledger: <path>`; `Score N/10 (critic said M/10) — X fix, Y needs-you, Z taste, W wrong, V settled; D dropped (no evidence)`; the table without the `checked` column; the `needs-you` questions and proposals, noting they can be answered by ticking the To do list and running `recheck`. In review mode: no edits.

## 6. Stamp

Steps 1–5, then one line first in the reply and the ledger: `APPROVED — N/10` when the score is ≥ 8 and no `important` is open, else `DEMOLISHED — N/10, blocked by c1, c4` (or the advice count when only the score falls short). Do not fix anything: the verdict must judge what the user is about to merge. A DEMOLISHED reply ends with `To fix: /vogon:vogon fix <target>`.

## 7. Fix mode

After step 5, read `${CLAUDE_SKILL_DIR}/references/fix-loop.md` (the `references/fix-loop.md` file next to this one) and follow it. Reviews that never fix do not load it.

## 8. Recheck

Load the ledger (the newest in `.vogon/`, or the path given). Ticked To do items (`- [x] c3 — … answer`) are the user's answers: treat each as settled for this run. Run one focused re-review against the diff since the ledger's commit or date, verify, score, and append `## Recheck` with the updated To do list to the same ledger. Reply with the score and the ids still open. No fixes.

## 9. Ask

Resolve the target, skip the settled list unless given, and spawn the critic with this line after the prompt block: `Quick opinion: give at most 5 findings, most severe first, in the usual format, and skip the score line.` Pass on its answer as it is, under one line naming the critic's model. No verification, score, ledger or fixes. End with `For a verified, scored ledger: /vogon:vogon <target>`.
