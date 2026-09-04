import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const extensionPath = join(root, "dist", "chromium");
const output = join(root, "store-assets");
const sourceIcon = join(root, "assets", "icon-source.png");
const sampleImage = join(root, "assets", "photopea-wordmark.png");

await mkdir(output, { recursive: true });

const context = await chromium.launchPersistentContext("", {
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  channel: "chromium",
  headless: true,
  viewport: { width: 1280, height: 800 },
});

try {
  const page = context.pages()[0] || (await context.newPage());
  await page.goto("https://www.photopea.com/", {
    timeout: 60_000,
    waitUntil: "domcontentloaded",
  });

  const startButtons = page.getByRole("button", {
    name: "Start using Photopea",
    exact: true,
  });
  if ((await startButtons.count()) > 0) await startButtons.first().click();

  const workspace = page.locator(".panelblock.mainblock");
  await workspace.waitFor({ state: "visible", timeout: 60_000 });

  const rejectConsent = page.getByRole("button", {
    name: "Do not consent",
    exact: true,
  });
  await rejectConsent.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
  if (await rejectConsent.isVisible()) await rejectConsent.click();

  await page.waitForFunction(
    () => {
      const editor = document.querySelector(".panelblock.mainblock");
      return (
        editor &&
        Math.abs(editor.getBoundingClientRect().right - document.documentElement.clientWidth) <= 6
      );
    },
    undefined,
    { timeout: 30_000 },
  );

  const fileInputs = page.locator('input[type="file"]');
  if ((await fileInputs.count()) > 0) {
    await fileInputs.first().setInputFiles(sampleImage);
    await page.waitForTimeout(1_500);
    await page.keyboard.press("Control+0");
    await page.waitForTimeout(500);
  }

  await page.screenshot({
    path: join(output, "screenshot-1280x800.png"),
  });

  const promo = await context.newPage();
  await promo.setViewportSize({ width: 440, height: 280 });
  const icon = await readFile(sourceIcon, "base64");
  await promo.setContent(`
    <!doctype html>
    <html>
      <head>
        <style>
          * { box-sizing: border-box; }
          html, body {
            width: 440px;
            height: 280px;
            margin: 0;
            overflow: hidden;
          }
          body {
            display: grid;
            place-items: center;
            background:
              radial-gradient(circle at 50% 45%, rgba(20, 184, 166, 0.24), transparent 42%),
              linear-gradient(145deg, #1f2937, #0b111d 70%);
          }
          img {
            width: 250px;
            height: 250px;
            object-fit: contain;
            filter: drop-shadow(0 18px 28px rgba(0, 0, 0, 0.4));
          }
        </style>
      </head>
      <body>
        <img src="data:image/png;base64,${icon}" alt="">
      </body>
    </html>
  `);
  await promo.screenshot({
    path: join(output, "small-promo-440x280.png"),
  });

  console.log(`Saved store assets to ${output}`);
} finally {
  await context.close();
}
