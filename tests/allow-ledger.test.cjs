// Tests for hooks/allow-ledger.mjs. Run: node tests/allow-ledger.test.cjs
// Uses a real temporary project folder so the paths are valid on every OS.
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const hook = path.join(__dirname, "..", "hooks", "allow-ledger.mjs");
const proj = fs.mkdtempSync(path.join(os.tmpdir(), "vogon-proj-"));
const other = fs.mkdtempSync(path.join(os.tmpdir(), "vogon-other-"));
fs.mkdirSync(path.join(proj, ".vogon"));
fs.writeFileSync(path.join(proj, ".vogon", "2026-01-01-old.md"), "ledger");
fs.writeFileSync(path.join(proj, ".vogon", ".gitignore"), "*\n");

const decide = (fp, tool = "Write") => {
  const out = execFileSync("node", [hook], {
    input: JSON.stringify({ tool_name: tool, cwd: proj, tool_input: { file_path: fp } }),
  }).toString();
  if (out.includes('"allow"')) return "allow";
  if (out.includes('"deny"')) return "deny";
  return "none";
};

const v = (...p) => path.join(proj, ".vogon", ...p);
const cases = [
  ["new ledger", v("2026-01-02-x.md"), "allow"],
  ["relative path inside", ".vogon/new.md", "allow"],
  ["Edit existing ledger (append a round)", v("2026-01-01-old.md"), "allow", "Edit"],
  ["Write over existing ledger", v("2026-01-01-old.md"), "deny"],
  ["rewrite existing .gitignore", v(".gitignore"), "allow"],
  ["outside .vogon", path.join(proj, "src", "a.py"), "none"],
  ["escape with ..", path.join(proj, ".vogon", "..", "src", "a.py"), "none"],
  ["look-alike folder", path.join(proj, ".vogon-evil", "a.md"), "none"],
  ["other project", path.join(other, ".vogon", "x.md"), "none"],
  ["Bash tool ignored", v("x.md"), "none", "Bash"],
];

let bad = 0;
for (const [name, fp, want, tool] of cases) {
  const got = decide(fp, tool);
  if (got !== want) bad++;
  console.log(`${got === want ? "OK  " : "FAIL"} ${name} -> ${got}`);
}
const garbage = execFileSync("node", [hook], { input: "not json" }).toString();
if (garbage !== "") bad++;
console.log(`${garbage === "" ? "OK  " : "FAIL"} bad input -> ${garbage === "" ? "none" : garbage}`);

fs.rmSync(proj, { recursive: true, force: true });
fs.rmSync(other, { recursive: true, force: true });
process.exit(bad);
