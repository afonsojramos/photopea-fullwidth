import { rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, "dist");

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`${command} exited with status ${result.status}`);
  }
}

for (const target of ["chromium", "firefox"]) {
  const archive = join(dist, `photopea-fullwidth-${target}.zip`);
  await rm(archive, { force: true });
  run("zip", ["-qr", archive, "."], join(dist, target));
  run("unzip", ["-tq", archive], root);
}

console.log("Packaged Chromium, Firefox, and userscript release assets");
