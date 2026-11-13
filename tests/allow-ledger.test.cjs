const { execFileSync } = require("child_process");
const path = require("path");
const hook = require("path").join(__dirname, "..", "hooks", "allow-ledger.mjs");
const run = (cwd, fp, tool = "Write") =>
  execFileSync("node", [hook], { input: JSON.stringify({ tool_name: tool, cwd, tool_input: { file_path: fp } }) }).toString();
const c = "C:\\proj";
const cases = [
  ["inside .vogon", c + "\\.vogon\\2026-x.md", true],
  ["relative path inside", ".vogon/x.md", true],
  ["Edit inside", c + "\\.vogon\\x.md", true, "Edit"],
  ["outside", c + "\\src\\a.py", false],
  ["escape with ..", c + "\\.vogon\\..\\src\\a.py", false],
  ["look-alike folder", c + "\\.vogon-evil\\a.md", false],
  ["other project", "C:\\other\\.vogon\\x.md", false],
  ["Bash tool ignored", c + "\\.vogon\\x.md", false, "Bash"],
];
let bad = 0;
for (const [name, fp, want, tool] of cases) {
  const allowed = run(c, fp, tool).includes('"allow"');
  if (allowed !== want) bad++;
  console.log(`${allowed === want ? "OK  " : "FAIL"} ${name} -> ${allowed ? "allow" : "no answer"}`);
}
const garbage = execFileSync("node", [hook], { input: "not json" }).toString();
console.log(`${garbage === "" ? "OK  " : "FAIL"} bad input -> ${garbage === "" ? "no answer" : garbage}`);
process.exit(bad);
