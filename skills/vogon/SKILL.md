---
name: vogon
description: Use when the user wants a critique, second opinion, devil's advocate or skeptical review of a plan, design doc, proposal, decision, commit, diff, documentation or work in progress; asks "what's wrong with this", to "poke holes in", "tear apart" or "sanity-check" it; asks to score, rate or grade it; asks "is this ready", "can I merge / ship this" or wants an approve-or-block verdict; asks "are the docs still right", "do the comments match the code", "what edge cases did I miss" or "check the error handling" about existing work; asks to fix something "until it passes"; or mentions vogon ("vogon this", "run vogon on"). Not for routine edits, explaining code, or a review the user asked to do with another named tool.
argument-hint: "[stamp | papertrail | loopholes | ask | fix | fix auto | recheck] <target>"
allowed-tools: Agent, AskUserQuestion, Read, Grep, Glob, Bash, PowerShell, Edit, Write
---

# Vogon

A fresh critic reviews the target without this conversation's reasoning; you verify its findings, score the target 1–10 and save a ledger.

**Arguments:** `$ARGUMENTS`

## Modes, lenses and words

Take the words from the arguments, or from the user's sentence. One mode, any lenses, then the target; nothing matches → review.

| Word | Also | Plain phrases | What happens |
|---|---|---|---|
| *(none)* | `review` | "second opinion", "rate it", "is this ready" | steps 1–5 |
| `stamp` | `gate`, `verdict`, `inspect`, `audit` | "can I merge this" | + APPROVED / DEMOLISHED (step 6) |
| `ask` | `quick` | "quick take", "poke holes in" | critic's answer only (step 9) |
| `fix` | | "fix it until it passes" | + fix loop (step 7) |
| `fix auto` | | + "without asking" | loop without asking |
| `recheck` | `again` | "did I fix it" | focused re-review (step 8) |
| lens `papertrail` | `docs`, `comments` | "are the docs still right" | critic checks docs vs. code first |
| lens `loopholes` | `edges`, `errors`, `holes` | "what edge cases did I miss" | critic checks failure paths first |

A lens combines with any mode. Options: `focus:`, `settled:` (decisions not to raise), `model: session | opus | sonnet | haiku | fable` (default `session`: pass no `model`, so the critic uses this conversation's model).

## 0. Confirm when you started it yourself

If the user's latest message starts with `/vogon` or names vogon, go on. Otherwise you chose this skill from their words: resolve the target (step 1), then ask once with AskUserQuestion before any critic runs — `Run vogon <mode> [lens] on <target>?` — with **Run it**, **Quick take instead** (`ask`) and **No, answer normally**; for `fix`, say it can take up to 3 rounds and a final full review. On **No**, answer without the skill. Without AskUserQuestion (a headless run), do not start: begin the reply with `Run /vogon:vogon <mode> <target> to review this.` and answer normally.

## Progress and cost

Print a `vogon:` line before the first critic (`critic on <model>, ETA ~1–2 min (estimate)`) and after each one: its time and tokens from the Agent result's `<usage>` line, the score, and the next step's ETA `(estimate)`. End the reply and the ledger with `Total: <n> critic runs, <sum>k critic tokens, <wall time>. Your own tokens: /cost` (you cannot see them, so do not guess).

Send independent reads, searches and edits together in one message; each separate step costs a model turn.

## 1. Resolve the target

| The user says | Target becomes |
|---|---|
| a path, directory, or commit range | as given |
| "my changes", "what I did", "the diff" | `git diff` + `git diff --cached` + untracked files; if clean, the branch against its base (`git log main..HEAD`) |
| "the plan", "the design", "the spec" | the plan discussed in this conversation; else the newest of `~/.claude/plans/*.md`, `docs/plans`, `docs/execplans`, `plans/`, `.design/` |
| a task, ticket or PR id | its description plus the work done for it so far |
| a topic ("the retry logic") | the files Grep/Glob find for it |

For half-done work, tell the critic what is finished and what is still planned. Still ambiguous → ask: reviewing the wrong target wastes a critic run.

Outside fix mode, in a git repository, take `git status --porcelain` and `git diff HEAD | git hash-object --stdin` at the start and before replying; if either changed, say `Files changed during the review (by vogon or anything else): <paths>`.

## 2. Gather the settled list

Decisions not to re-raise, each with its source: the `settled:` argument and this conversation; settled or decided lines in the project's `MEMORY.md` (under `~/.claude/projects/<project>/memory/`); titles in `docs/decisions`, `docs/adr`, `adr/` or `decisions/` that touch the target.

## 3. Spawn the critic

One Agent call with `subagent_type: "vogon:critic"`; pass `model` only when the user named one, the same for every critic in the run. Without the plugin's agent, use `general-purpose` with the body of `agents/critic.md` (`${CLAUDE_PLUGIN_ROOT}/agents/critic.md`, or `../../agents/critic.md` from this folder) atop the prompt.

```
Review target: <target>
State: <"finished" | "in progress: done = …, still planned = …">
Lens: <papertrail | loopholes | papertrail, loopholes | none>
Focus (weigh first): <focus or "none">
Settled — do not raise these, they are decided:
<settled list, or "none">
```

### Focused re-review (fix rounds and `recheck`)

A critic that re-reads everything finds new faults in the fixes' text and costs a full review, so append:

```
Focused re-review. Do not review the whole target again.
1. For each previous finding, answer resolved / still-open (why) / made-worse (why):
<id | severity | finding | the What and Scenario lines from the ledger>
2. Report new findings only inside these changed lines, or that these changes cause elsewhere:
<unified diff of the target since the previous review>
```

For the diff, copy each target file, keeping its path from the project root: to `.vogon/.tmp/start/<path>` once before the first fix, and to `.vogon/.tmp/prev/<path>` before each round (replacing the last). Copy with Write or the shell's copy command (bash or PowerShell); diff with `git diff --no-index .vogon/.tmp/prev/<path> <path>`, which works anywhere git is installed. Delete `.vogon/.tmp/` when the run ends.

## 4. Validate, triage, score

Drop findings without an id, severity, evidence or mechanism, and count them. Verify every claim and note how in a `checked` column: Grep a finding's `Quote:` in the cited file (`quote matches store.py:34`), else Read / Grep / git (`Read client.py:15-26`). A quote that does not match just means checking the usual way, never dropping the finding.

| Verdict | Meaning |
|---|---|
| `fix` | Real, verified, concrete benefit. Say if small enough to do now. |
| `needs-you` | Only the user can decide (a fact, a cost, a product or contract choice). One line: what to decide. |
| `taste` | Could go either way. One line: the trade-off. |
| `wrong` | The critic is mistaken: what is true and how you checked. Unchecked disagreement is `wrong (unverified)`. |
| `settled` | Re-opens an item on the settled list. Name the source. |

Every `important` finding ends as `fix`, `needs-you`, `wrong` or `settled`. `info` gets no verdict (`—`). A finding about lines you changed in a fix round is `wrong` only with a quote that disproves it: models tend to defend their own text.

**Score (1–10)** from the verified findings still open (`wrong`, `settled`, `info` and findings answered by a marked proposal do not count):
- no `important` open: **10 − number of `advice`**, floor 5;
- `important` open: **6 − (number of `important` − 1)**, floor 1.

So 8 means: nothing important, at most two advice. Show the critic's own score beside yours; when they differ by 2 or more, say why in one line.

## 5. Archive and reply

Write the ledger to `.vogon/<YYYY-MM-DD>-<slug>.md` in the project root (if taken, `-2`, `-3`; the hook refuses overwrites, so later rounds are appended with Edit). The first time, also write `.vogon/.gitignore` containing `*`; leave the user's `.gitignore` and `.git/` alone. Contents: target, reviewed commit (`git rev-parse HEAD`; with uncommitted changes, `git stash create`, a snapshot commit of the working tree that changes nothing; or "not under git"), lens, focus, settled list, the critic's model, time, tokens and `agentId` (its transcript, `subagents/agent-<agentId>.jsonl` under `~/.claude/projects/`, is deleted eventually), `What looks good`, the table `id | severity | verdict | finding | evidence | checked`, the `What` and `Scenario` lines of each open finding, the score, the totals line, and last:

```
## To do
- [ ] c3 — <the needs-you question>
- [ ] proposal — <value written as "(proposed — confirm)", where>
```

Reply with: `Ledger: <path>`; `Score N/10 (critic said M/10) — X fix, Y needs-you, Z taste, W wrong, V settled; D dropped (no evidence)`; the table without the `checked` column; the `needs-you` questions and proposals, noting they can be answered by ticking the To do list and running `recheck`. In review mode: no edits.

## 6. Stamp

Steps 1–5, then one line first in the reply and the ledger: `APPROVED — N/10` when the score is ≥ 8 and no `important` is open, else `DEMOLISHED — N/10, blocked by c1, c4` (or the advice count when only the score falls short). Do not fix anything: the verdict must judge what the user is about to merge. A DEMOLISHED reply ends with `To fix: /vogon:vogon fix <target>`.

## 7. Fix mode

After step 5, read and follow `${CLAUDE_SKILL_DIR}/references/fix-loop.md` (`references/fix-loop.md` next to this file).

## 8. Recheck

Load the ledger (the newest in `.vogon/`, or the path given). Ticked To do items (`- [x] c3 — … answer`) are the user's answers: treat each as settled for this run. Run one focused re-review against `git diff <the ledger's reviewed commit>` (no commit recorded → the last one before the ledger's date). Not under git → no baseline exists, so the critic re-reads the whole target; say so in the reply. Then verify, score, and append `## Recheck` with the updated To do list to the same ledger. Reply with the score and the ids still open. No fixes.

## 9. Ask

Resolve the target, skip the settled list unless given, and spawn the critic with this line after the prompt block: `Quick opinion: give at most 5 findings, most severe first, in the usual format, and skip the score line.` Pass on its answer as it is, under one line naming the critic's model. No verification, score, ledger or fixes. End with `For a verified, scored ledger: /vogon:vogon <target>`.
