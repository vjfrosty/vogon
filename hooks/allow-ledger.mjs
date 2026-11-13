// PreToolUse hook: let the vogon skill save its ledgers without a permission prompt.
//
// Allows a Write or Edit only when the target file is inside <project>/.vogon/.
// Anything else gets no answer from this hook, so Claude Code's normal permission
// rules apply unchanged. If Node is missing or anything fails, the hook stays silent
// and the user simply sees the usual prompt.

import path from "node:path";

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

    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "allow",
          permissionDecisionReason: "vogon: saving a review ledger in .vogon/",
        },
      }),
    );
  } catch {
    // Stay silent: the normal permission prompt applies.
  }
});
