import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, "dist");
const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));

async function buildExtension(name, manifestPath) {
  const output = join(dist, name);
  await mkdir(output, { recursive: true });
  await Promise.all([
    cp(manifestPath, join(output, "manifest.json")),
    cp(join(root, "icons"), join(output, "icons"), { recursive: true }),
    cp(join(root, "photopea.js"), join(output, "photopea.js")),
    cp(join(root, "photopea.css"), join(output, "photopea.css")),
  ]);
}

function userscriptHeader(version) {
  return `// ==UserScript==
// @name         Photopea Full Width
// @namespace    https://github.com/afonsojramos/photopea-fullwidth
// @version      ${version}
// @description  Reclaim Photopea's reserved ad column, hide its home-screen logo, and remove its source-code warning.
// @match        https://photopea.com/*
// @match        https://www.photopea.com/*
// @run-at       document-start
// @grant        none
// @inject-into  page
// @sandbox      raw
// @updateURL    https://github.com/afonsojramos/photopea-fullwidth/releases/latest/download/photopea-fullwidth.user.js
// @downloadURL  https://github.com/afonsojramos/photopea-fullwidth/releases/latest/download/photopea-fullwidth.user.js
// ==/UserScript==`;
}

function userscriptStyle(css) {
  return `(() => {
  "use strict";

  function installStyle() {
    const root = document.head || document.documentElement;
    if (!root || document.getElementById("photopea-fullwidth-style")) return;

    const style = document.createElement("style");
    style.id = "photopea-fullwidth-style";
    style.textContent = ${JSON.stringify(css)};
    root.append(style);
  }

  installStyle();
  document.addEventListener("DOMContentLoaded", installStyle, { once: true });
})();`;
}

await rm(dist, { recursive: true, force: true });
await Promise.all([
  buildExtension("chromium", join(root, "manifest.json")),
  buildExtension("firefox", join(root, "firefox", "manifest.json")),
]);

const [javascript, css] = await Promise.all([
  readFile(join(root, "photopea.js"), "utf8"),
  readFile(join(root, "photopea.css"), "utf8"),
]);
const userscript = [
  userscriptHeader(packageJson.version),
  "",
  userscriptStyle(css),
  "",
  javascript.trim(),
  "",
].join("\n");

await writeFile(join(dist, "photopea-fullwidth.user.js"), userscript);
console.log(`Built Photopea Full Width ${packageJson.version}`);
