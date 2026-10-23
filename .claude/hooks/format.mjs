// PostToolUse hook: formats the file Claude just edited with the project's Prettier config.
// Files listed in .prettierignore (CLAUDE.md, AGENTS.md, docs/, ...) are skipped by Prettier itself.
import { spawnSync } from "node:child_process";

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  const filePath = JSON.parse(input).tool_input?.file_path;
  if (!filePath) return;

  spawnSync(
    "pnpm",
    ["exec", "prettier", "--write", "--ignore-unknown", filePath],
    {
      cwd: process.env.CLAUDE_PROJECT_DIR,
      stdio: "ignore",
    },
  );
});
