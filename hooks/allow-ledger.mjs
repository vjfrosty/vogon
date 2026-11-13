// PreToolUse hook: let the vogon skill save its ledgers without a permission prompt,
// and never let it overwrite one.
//
// Inside <project>/.vogon/:
//   - Write to a new file, or Edit of any file -> allow (no prompt);
//   - Write to a file that already exists      -> deny (ledgers are append-only;
//     the skill saves a new one as -2, -3 or appends a round with Edit).
// Anything else gets no answer from this hook, so Claude Code's normal permission
// rules apply unchanged. If Node is missing or anything fails, the hook stays silent
// and the user simply sees the usual prompt.

import fs from "node:fs";
import path from "node:path";

const answer = (decision, reason) =>
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: decision,
        permissionDecisionReason: reason,
      },
    }),
  );

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const event = JSON.parse(input);
    if (!["Write", "Edit"].includes(event.tool_name)) return;

    const cwd = path.resolve(event.cwd || process.cwd());
    const target = path.resolve(cwd, String(event.tool_input?.file_path || ""));
    const ledgers = path.join(cwd, ".vogon") + path.sep;

    const sameCase = process.platform === "win32" || process.platform === "darwin";
    const norm = (p) => (sameCase ? p.toLowerCase() : p);
    if (!norm(target).startsWith(norm(ledgers))) return;

    const isLedger = path.basename(target) !== ".gitignore";
    if (event.tool_name === "Write" && isLedger && fs.existsSync(target)) {
      answer(
        "deny",
        "vogon: ledgers are never overwritten. Save this one as <name>-2.md (-3, ...) or append to the existing ledger with Edit.",
      );
      return;
    }
    answer("allow", "vogon: saving a review ledger in .vogon/");
  } catch {
    // Stay silent: the normal permission prompt applies.
  }
});
