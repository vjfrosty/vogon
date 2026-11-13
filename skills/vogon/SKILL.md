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

A lens combines with any mode (`/vogon:vogon fix loopholes src/`); both lenses may be given. Options anywhere: `focus: <what to weigh first>`, `settled: <decisions the critic must not raise>`, `model: <session | opus | sonnet | haiku | fable>` (default `session`: this conversation's model; "use Opus", "with Sonnet" mean the same).

## 0. Confirm when you started it yourself

Look at the user's latest message. If it starts with `/vogon` or names vogon ("vogon this", "run vogon on X"), the user asked for it: go on to step 1. Otherwise you chose this skill from their words, so resolve the target (step 1) and then ask once with AskUserQuestion before any critic runs: `Run vogon <mode> [lens] on <target>?` with the options **Run it**, **Quick take instead** (`ask` mode, one short critic run), and **No, answer normally**. For `fix` or `fix auto`, say in the question that it can take up to 3 rounds and a critic run each. On **No**, leave the skill and answer the user's request without it. If AskUserQuestion is not available (a headless run), do not start: begin the reply with the line `Run /vogon:vogon <mode> <target> to review this.` and then answer normally.

## 1. Resolve the target

| The user says | Target becomes |
|---|---|
| a path, directory, or commit range | as given |
| "my changes", "what I did", "the diff" | `git diff` + `git diff --cached` + untracked files from `git status`; if clean, the branch against its base (`git log main..HEAD`) |
| "the plan", "the design", "the spec" | the plan discussed in this conversation; else the newest of `~/.claude/plans/*.md`, `docs/plans`, `docs/execplans`, `plans/`, `.design/` |
| a task, ticket or PR id | its description plus the work done for it so far (commits, diff, files it names) |
| a topic ("the retry logic") | the files Grep/Glob find for it |

Half-done work is reviewed as half-done: tell the critic what is finished and what is still planned. Still ambiguous → ask. Never critique a guess.

## 2. Gather the settled list

Decisions the critic must not re-raise, one bullet each with its source; skip what doesn't exist:
- the `settled:` argument and anything settled in this conversation;
- the project's memory index (`MEMORY.md` under `~/.claude/projects/<project>/memory/`): lines saying settled, decided, resolved, closed, don't re-raise;
- titles in `docs/decisions`, `docs/adr`, `adr/` or `decisions/` that touch the target's area.

## 3. Spawn the critic

One Agent call with `subagent_type: "vogon:critic"`. Pass `model` only when the user named one; otherwise the agent runs on this conversation's model. Use the same model for every critic in the run.

If that agent is not available (skill installed without the plugin), use `subagent_type: "general-purpose"` with the same `model` rule and put the body of `${CLAUDE_PLUGIN_ROOT}/agents/critic.md` (below its front matter) at the top of the prompt; in a manual install that file is `../../agents/critic.md` from this skill's folder.

The prompt:

```
Review target: <target>
State: <"finished" | "in progress: done = …, still planned = …">
Lens: <papertrail | loopholes | papertrail, loopholes | none>
Focus (weigh first): <focus or "none">
Settled — do not raise these, they are decided:
<settled list, or "none">
```

### Focused re-review (fix rounds and `recheck`)

A re-review does not read the whole target again: a fresh critic reading everything finds new faults in text the fixes wrote, and each round costs as much as the first. Append:

```
Focused re-review. Do not review the whole target again.
1. For each previous finding, answer resolved / still-open (why) / made-worse (why):
<id | severity | finding>
2. Report new findings only inside these changed lines, or that these changes cause elsewhere:
<unified diff of the target since the previous review>
```

For the diff, copy the target before applying fixes (`cp <target> <scratch>/before`) and use `diff -u` (for code under git, `git diff` since the recorded commit).

## 4. Validate, triage, score

Drop a finding that lacks an id, a severity, evidence or a mechanism, and count the dropped. Verify every claim that names a file, line or behaviour yourself (Read / Grep / git). Give each finding one verdict:

| Verdict | Meaning |
|---|---|
| `fix` | Real, verified, concrete benefit. Say if small enough to do now. |
| `needs-you` | Only the user can decide (a fact, a cost, a product or contract choice). One line: what to decide. |
| `taste` | Could go either way. One line: the trade-off. |
| `wrong` | The critic is mistaken: what is true and how you checked. Unchecked disagreement is `wrong (unverified)`. |
| `settled` | Re-opens an item on the settled list. Name the source. |

Every `important` finding ends as `fix`, `needs-you`, `wrong` or `settled` — never `taste`, never open. `info` gets no verdict (`—`).

**Score (1–10)** from the verified findings still open (`wrong`, `settled`, `info` and findings answered by a marked proposal do not count):
- no `important` open: **10 − number of `advice`**, floor 5;
- `important` open: **6 − (number of `important` − 1)**, floor 1.

So 8 means: nothing important, at most two advice. Show the critic's own score beside yours; when they differ by 2 or more, say why in one line.

## 5. Archive and reply

Write the ledger to `.vogon/<YYYY-MM-DD>-<slug>.md` in the project root; the first time, also write `.vogon/.gitignore` containing `*` so git ignores the folder. Never edit the user's `.gitignore` or `.git/`. The slug is the target's file name or a few words for it. If the file exists, use `-2`, `-3`, … (the plugin's hook refuses to overwrite a ledger; add later rounds with Edit). Contents: target, lens, focus, settled list, the critic's answer verbatim, the ledger table, the score, and last:

```
## To do
- [ ] c3 — <the needs-you question>
- [ ] proposal — <value written as "(proposed — confirm)", where>
```

(none open → `## To do` with `- nothing`). Reply with:

1. `Ledger: <path>`
2. `Score N/10 (critic said M/10) — X fix, Y needs-you, Z taste, W wrong, V settled; D dropped (no evidence)`
3. The table: `id | severity | verdict | finding (one line) | evidence`
4. The `needs-you` questions, numbered, and any proposals to confirm; say they can be answered by ticking the To do list and running `recheck`.

In review mode: no edits, no fix proposals beyond the one-line notes.

## 6. Stamp

Steps 1–5, then put one line first in the reply and at the top of the ledger:
- `APPROVED — N/10` when the score is ≥ 8 and no `important` finding is open;
- otherwise `DEMOLISHED — N/10, blocked by c1, c4` naming the open `important` findings (or the advice count when it is the score that falls short).

Never fix in stamp mode. A DEMOLISHED reply ends with `To fix: /vogon:vogon fix <target>`.

## 7. Fix mode — loop to 8

After step 5, repeat up to **3 rounds**:

1. **Plan the round:** one line per `fix` finding (`id — what will change, where`), plus every `needs-you` finding.
2. **Approve.** `fix`: one AskUserQuestion per round showing the plan; the user applies all, picks ids, or stops, and answers any important `needs-you` there. An unapproved `fix` becomes `declined` and leaves the score. `fix auto`: no question; print the plan as the round's log, and for each `needs-you` take the smaller, reversible option as a marked proposal.
3. **Apply** each approved fix as the smallest edit that makes its finding false: change only the sentence, step or lines it names. No new sections, no restructuring, no improvements no finding asked for — every added line is new surface for the next critic. A value only the user can set (a retention period, a deadline, a budget, who is on call) is never written as fact: write `14 days (proposed — confirm)` and add it to the To do list; that finding leaves the score, and the reply says the score assumes the proposals are accepted. For code, run the project's tests after the edits. Leave `taste` alone. Never commit.
4. **Re-review:** step 3 as a focused re-review, then step 4. Append `## Round <n>` to the ledger with Edit: what was applied, declined or proposed, the new score, the table, and the updated To do list.
5. **Stop** when the score is ≥ 8, when nothing left is yours to fix (only `needs-you`, `taste`, `declined`), or after round 3. Never run a fourth round.

Final reply: the score per round (`3 → 6 → 8`), what was fixed, the proposals to confirm, and what is left. When it did not reach 8, say so and list what still stands.

## 8. Recheck

After the user has acted on a ledger: load it (the newest in `.vogon/`, or the path given). Ticked To do items (`- [x] c3 — … answer`) are the user's answers: treat each as settled for this run. Run one focused re-review against the diff since the ledger's date or commit, verify, score, and append `## Recheck` (with the updated To do list) to the same ledger. Reply with the score and the ids still open. No fixes.

## 9. Ask

A quick opinion while working. Resolve the target (step 1), skip the settled list unless the user gave one, and spawn the critic (step 3) with this line after the prompt block:

```
Quick opinion: give at most 5 findings, most severe first, in the usual format, and skip the score line.
```

Pass on the critic's answer as it is, under one line naming the critic's model. Do not verify, score, archive or fix. End with: `For a verified, scored ledger: /vogon:vogon <target>`.
