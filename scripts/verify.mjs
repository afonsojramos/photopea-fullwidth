import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const iconSizes = [16, 32, 48, 128];
const packageJson = await readJson(join(root, "package.json"));
const chromium = await readJson(join(root, "dist", "chromium", "manifest.json"));
const firefox = await readJson(join(root, "dist", "firefox", "manifest.json"));
const source = await readFile(join(root, "photopea.js"), "utf8");
const userscript = await readFile(
  join(root, "dist", "photopea-fullwidth.user.js"),
  "utf8",
);

assert.equal(chromium.version, packageJson.version);
assert.equal(firefox.version, packageJson.version);
assert.equal(chromium.manifest_version, 3);
assert.equal(firefox.manifest_version, 3);
assert.deepEqual(chromium.icons, firefox.icons);
assert.deepEqual(firefox.browser_specific_settings.gecko.data_collection_permissions, {
  required: ["none"],
});
assert.match(userscript, new RegExp(`@version\\s+${packageJson.version.replaceAll(".", "\\.")}`));
assert.match(source, /Something is changing our source code/);
assert.match(source, /Many features will not work correctly/);
assert.match(source, /new MutationObserver/);

for (const target of ["chromium", "firefox"]) {
  for (const size of iconSizes) {
    const icon = await readFile(
      join(root, "dist", target, "icons", `icon${size}.png`),
    );
    assert.equal(icon.toString("ascii", 1, 4), "PNG");
    assert.equal(icon.readUInt32BE(16), size);
    assert.equal(icon.readUInt32BE(20), size);
  }
}

for (const path of [
  join(root, "photopea.js"),
  join(root, "dist", "photopea-fullwidth.user.js"),
]) {
  const result = spawnSync(process.execPath, ["--check", path], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
}

console.log(`Verified Photopea Full Width ${packageJson.version}`);
