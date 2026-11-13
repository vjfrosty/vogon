---
name: critique
description: Use when the user wants an independent, skeptical second opinion on a plan, design doc, proposal, decision, diff or commit range before committing to it or shipping it, wants it scored, or wants it fixed and re-reviewed until it passes.
disable-model-invocation: true
allowed-tools: Agent, Read, Grep, Glob, Bash, Write, Edit
---

# Critique

One fresh Opus critic reviews the target without this conversation's reasoning. You verify what it says, score the target 1–10 from the verified findings, and hand the user a ledger. In `fix` mode you also fix what is yours to fix and loop until the score reaches 8.

**Arguments:** `$ARGUMENTS`
- `<target>` — path, directory, commit range or topic. Review only (steps 1–5).
- `fix <target>` — review, then fix and re-review until score ≥ 8 (step 6), asking once per round before fixes are applied.
- `fix auto <target>` — the same loop without asking: questions only the user can answer become marked proposals.
- `recheck [ledger path]` — one focused re-review of the newest ledger for this project (step 7). No fixes.
- Optional anywhere: `focus: <what to weigh first>`, `settled: <decisions the critic must not raise>`.

## 1. Resolve the target

Make the argument one concrete reference. Anything in progress is a valid target:

| The user says | Target becomes |
|---|---|
| a path, directory, or commit range | as given |
| "my changes", "what I did", "the diff" | the working tree: `git diff` + `git diff --cached` + untracked files from `git status`; if clean, the branch against its base (`git log main..HEAD`) |
| "the plan", "the design", "the spec" | the plan discussed in this conversation; else the newest of `~/.claude/plans/*.md`, `docs/plans`, `docs/execplans`, `plans/`, `.design/` (whichever exist) |
| a task, ticket or PR id | its description plus the work done for it so far (commits, diff, files it names) — the critic judges the work against the task |
| a topic ("the retry logic") | the files Grep/Glob find for it |

Half-done work is reviewed as half-done: the critic is told what is finished and what is still planned, so it does not report planned steps as missing. Still ambiguous → ask. Never critique a guess.

## 2. Gather the settled list

Decisions the critic must not re-raise, one bullet each with its source. Take what exists, skip what doesn't:
- the user's `settled:` argument and anything settled in this conversation;
- the project's memory index (`MEMORY.md` under `~/.claude/projects/<project>/memory/`): lines saying settled, decided, resolved, closed, don't re-raise;
- titles in a decisions folder (`docs/decisions`, `docs/adr`, `adr/`, `decisions/`) that touch the target's area.

## 3. Spawn the critic

One Agent call: `subagent_type: "general-purpose"`, `model: "opus"`. Prompt = the full text of `critic_prompt.md` (next to this file), then:

```
Review target: <target>
State: <"finished" | "in progress: done = …, still planned = …">
Focus (weigh first): <focus or "none">
Settled — do not raise these, they are decided:
<settled list, or "none">
```

### Focused re-review (fix rounds and `recheck`)

The first review reads the whole target. A re-review does not: a fresh critic reading everything again finds new faults in text the fixes wrote, and each round then costs as much as the first. Append instead:

```
Focused re-review. Do not review the whole target again.
1. For each previous finding, answer resolved / still-open (why) / made-worse (why):
<id | severity | finding>
2. Report new findings only inside these changed lines, or that these changes cause elsewhere:
<unified diff of the target since the previous review>
```

For the diff, copy the target before applying fixes (`cp <target> <scratch>/before`) and use `diff -u` (for code under git, `git diff` since the recorded commit).

## 4. Validate, triage, score

Keep a finding only when it has an id, one of the three severities, evidence (`path:line`, section, or commit) **and** a named mechanism; count the dropped. Verify every claim that names a file, line or behaviour yourself (Read / Grep / git). Give each finding one verdict:

| Verdict | Meaning |
|---|---|
| `fix` | Real, verified, concrete benefit. Say if small enough to do now. |
| `needs-you` | Only the user can decide (a fact, a cost, a product or contract choice, a trade-off they own). One line: what to decide. |
| `taste` | Could go either way. One line: the trade-off. |
| `wrong` | The critic is mistaken: what is true and how you checked. Unchecked disagreement is written `wrong (unverified)`. |
| `settled` | Re-opens an item on the settled list. Name the source. |

Every `important` finding ends as `fix`, `needs-you`, `wrong` or `settled` — never `taste`, never open. An `info` finding gets no verdict; show it with `—`.

**Score (1–10)**, from the verified findings that are still open (`wrong`, `settled`, `info` and findings answered by a marked proposal do not count):

- no `important` open: **10 − number of `advice`**, floor 5;
- `important` open: **6 − (number of `important` − 1)**, floor 1.

So 8 means: nothing important, at most two advice-level findings. The critic's own score line is shown beside yours; when they differ by 2 or more, say why in one line.

## 5. Archive and reply

Save to `~/.claude/skills/critique/runs/<project-dir-name>/<YYYY-MM-DD>-<slug>.md`, where the slug is the target's file name or a few words for it. If that file exists, add `-2`, `-3`, … — never overwrite a ledger. Contents: target, focus, settled list, the critic's answer verbatim, the ledger table, the score. Reply with:

1. `Ledger: <path>`
2. `Score N/10 (critic said M/10) — X fix, Y needs-you, Z taste, W wrong, V settled; D dropped (no evidence)`
3. The table: `id | severity | verdict | finding (one line) | evidence`
4. The `needs-you` questions, numbered, and any proposals to confirm.

In review mode: no edits, no fix proposals beyond the one-line notes. The user picks what to act on.

## 6. Fix mode — loop to 8

After step 5, repeat up to **3 rounds**:

1. **Plan the round:** one line per `fix` finding (`id — what will change, where`), plus every `needs-you` finding.
2. **Approve.** `fix`: one AskUserQuestion per round showing the plan; the user applies all, picks ids, or stops, and answers any important `needs-you` there. An unapproved `fix` becomes `declined` and leaves the score. `fix auto`: no question; print the plan as the round's log, and for each `needs-you` take the smaller, reversible option as a marked proposal (next item).
3. **Apply** each approved fix as the smallest edit that makes its finding false: change the sentence, step or lines the finding names and nothing around them. No new sections, no restructuring, no improvements no finding asked for. Every line you add is new surface for the next critic; in testing, rounds that rewrote text scored lower than the round before. A value only the user can set (a retention period, a deadline, a TTL, a budget, who is on call) is never written as fact: write it as `14 days (proposed — confirm)` and list it under proposals to confirm. That finding then leaves the score, and the reply says the score assumes the proposals are accepted. For code, run the project's tests after the edits. Leave `taste` alone. Never commit; the user does.
4. **Re-review**: step 3 as a focused re-review, then step 4. Append `## Round <n>` to the same ledger with what was applied, declined or proposed, the new score and the table.
5. **Stop** when the score is ≥ 8, when nothing left is yours to fix (only `needs-you`, `taste`, `declined`), or after round 3.

Final reply: the score per round (`3 → 6 → 8`), what was fixed, the proposals to confirm, and what is left. The loop does not always reach 8 in three rounds; when it does not, say so and list what still stands. Never run a fourth round.

## 7. Recheck (`/critique recheck`)

After the user has acted on a ledger: load it (the newest for this project, or the path given), run one focused re-review against the diff since the ledger's date or commit, verify, score, and append `## Recheck` to the same ledger. Reply with the score and the ids still open. No fixes.
