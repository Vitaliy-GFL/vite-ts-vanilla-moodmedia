// mtemplate compile expects mframe.json and index.html at the repo root.
import { copyFileSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";

copyFileSync("public/mframe.json", "mframe.json");
copyFileSync("dist/index.html", "index.html");

try {
  execSync("mtemplate compile", { stdio: "inherit" });
} finally {
  rmSync("mframe.json", { force: true });
  rmSync("index.html", { force: true });
}
