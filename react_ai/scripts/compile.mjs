// mtemplate compile expects mframe.json and index.html at the repo root.
import { copyFileSync, rmSync, readdirSync } from "node:fs";
import { execSync } from "node:child_process";

copyFileSync("public/mframe.json", "mframe.json");
copyFileSync("dist/index.html", "index.html");

// Sourcemaps are for local debugging only — keep them out of the player zip.
for (const file of readdirSync("dist/assets")) {
  if (file.endsWith(".map")) rmSync(`dist/assets/${file}`);
}

try {
  execSync("mtemplate compile", { stdio: "inherit" });
} finally {
  rmSync("mframe.json", { force: true });
  rmSync("index.html", { force: true });
}
