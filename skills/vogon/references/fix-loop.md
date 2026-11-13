# Fix mode — loop to 8

Read this only in `fix` or `fix auto` mode, after step 5 of SKILL.md. Repeat up to **3 rounds**:

1. **Plan the round:** one line per `fix` finding (`id — what will change, where`), plus every `needs-you` finding.
2. **Approve.** `fix`: one AskUserQuestion per round showing the plan; the user applies all, picks ids, or stops, and answers any important `needs-you` there. An unapproved `fix` becomes `declined` and leaves the score. `fix auto`: no question; print the plan as the round's log, and for each `needs-you` take the smaller, reversible option as a marked proposal.
3. **Apply** each approved fix as the smallest change that makes its finding false.
   - Change the sentence, step or lines the finding names. When the finding is that something is missing (no rollback, no backup, no timeout), add the one step or block it needs, in the place it belongs, and nothing else.
   - Before writing a fix, check what else in the target it touches: a later step that relies on the old wording, a port, path or order another step assumes. In testing, fixes that ignored this broke two other steps and the loop stalled at 6.
   - Do not restructure or improve what no finding asked about: every added line is new surface for the next critic, and rounds that rewrote text scored lower than the round before.
   - A value only the user can set (a retention period, a deadline, a budget, who is on call) is not yours to decide, so it is never written as fact: write `14 days (proposed — confirm)` and add it to the To do list; that finding leaves the score, and the reply says the score assumes the proposals are accepted.
   - **Do not over-extend.** Prefer rewording or removing over adding: the target should end the loop about as long as it started, not longer by the size of everything the critic mentioned. After each round, measure the growth with `git diff --numstat` (or `--no-index` against the copy in `.vogon/.tmp/`) and log it (`round 1: +12 −9 lines`). If a round adds more than about a fifth of the target's starting length, stop and say so: a plan that needs that much new text needs the user's design decision, not more fixes.
   - Send all of the round's edits in one message. For code, run the project's tests after the edits. Leave `taste` alone.
   - Do not commit: the user reviews the changes and commits them.
4. **Re-review:** step 3 of SKILL.md as a focused re-review, then step 4. Append `## Round <n>` to the ledger with Edit: what was applied, declined or proposed, the new score, the table, and the updated To do list.
5. **Stop** when the score is ≥ 8, when nothing left is yours to fix (only `needs-you`, `taste`, `declined`), or after round 3. There is no fourth round: what is still open after three rounds usually needs the user's decision rather than another edit, and each round costs a full critic run.

Before the final reply, delete `.vogon/.tmp/`. Final reply: the score per round (`3 → 6 → 8`), what was fixed, the proposals to confirm, and what is left. When it did not reach 8, say so and list what still stands.
