import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const extensionPath = join(root, "dist", "chromium");

const context = await chromium.launchPersistentContext("", {
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  channel: "chromium",
  headless: true,
  viewport: { width: 1440, height: 900 },
});
let page;
const browserErrors = [];

try {
  page = context.pages()[0] || (await context.newPage());
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await page.goto("https://www.photopea.com/", {
    timeout: 60_000,
    waitUntil: "domcontentloaded",
  });

  const mainBlock = page.locator(".panelblock.mainblock");
  const startButtons = page.getByRole("button", {
    name: "Start using Photopea",
    exact: true,
  });
  const rejectConsent = page.getByRole("button", {
    name: "Do not consent",
    exact: true,
  });
  const startButtonCount = await startButtons.count();

  if (startButtonCount > 0) {
    await startButtons.first().click();
  }

  await mainBlock.waitFor({ state: "visible", timeout: 60_000 });
  await rejectConsent.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});

  if (await rejectConsent.isVisible()) {
    await rejectConsent.click();
  }

  const waitForFullWidth = () =>
    page.waitForFunction(
      () => {
        const workspace = document.querySelector(".panelblock.mainblock");
        return (
          workspace &&
          Math.abs(
            workspace.getBoundingClientRect().right - document.documentElement.clientWidth,
          ) <= 6
        );
      },
      undefined,
      { timeout: 30_000 },
    );

  const workspaceGeometry = async () => {
    await waitForFullWidth();
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(resolve));
        }),
    );

    return page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      spoofedWidth: window.innerWidth,
      workspaceRight: Math.round(
        document.querySelector(".panelblock.mainblock").getBoundingClientRect().right,
      ),
    }));
  };

  const assertFullWidth = async (expectedWidth, label) => {
    const geometry = await workspaceGeometry();
    assert.equal(geometry.clientWidth, expectedWidth, `${label} viewport width changed`);
    assert.ok(
      Math.abs(geometry.workspaceRight - geometry.clientWidth) <= 6,
      `${label} workspace ends at ${geometry.workspaceRight}px instead of ${geometry.clientWidth}px`,
    );
    return geometry;
  };

  const initialGeometry = await assertFullWidth(1440, "initial");

  const result = await page.evaluate(() => {
    const logos = Array.from(
      document.querySelectorAll('.panelblock.mainblock .storageset img[style*="drop-shadow"]'),
    );

    return {
      logoMatches: logos.length,
      logosHidden: logos.every((logo) => getComputedStyle(logo).display === "none"),
    };
  });

  assert.ok(
    initialGeometry.spoofedWidth > initialGeometry.clientWidth,
    "Photopea no longer reserves ad width",
  );
  assert.ok(result.logoMatches > 0, "Photopea home logo selector no longer matches");
  assert.ok(result.logosHidden, "Photopea home logo is still visible");

  await page.setViewportSize({ width: 1600, height: 900 });
  const wideGeometry = await assertFullWidth(1600, "wide");

  await page.setViewportSize({ width: 1440, height: 900 });
  const shrunkGeometry = await assertFullWidth(1440, "shrunk");
  assert.ok(
    shrunkGeometry.spoofedWidth < wideGeometry.spoofedWidth,
    "width override did not decrease after shrinking the viewport",
  );

  await page.evaluate(() => {
    const warning = document.createElement("div");
    warning.dataset.photopeaCompatibilityWarning = "";
    const firstPart = document.createElement("span");
    firstPart.textContent = "Something is changing our source code.";
    warning.append(firstPart);
    document.body.append(warning);
  });
  await page.evaluate(() => {
    const warning = document.querySelector("[data-photopea-compatibility-warning]");
    const secondPart = document.createElement("span");
    secondPart.textContent = "Many features will not work correctly.";
    warning.append(secondPart);
  });
  await page
    .locator("[data-photopea-compatibility-warning]")
    .waitFor({ state: "detached", timeout: 5_000 });

  console.log(
    `Photopea is compatible: ${result.logoMatches} logo matches, workspace ${initialGeometry.workspaceRight}/${initialGeometry.clientWidth}px`,
  );
} catch (error) {
  if (page) {
    const diagnostics = await page
      .evaluate(() => ({
        bodyClasses: document.body?.className || "",
        bodyText: document.body?.innerText.slice(0, 500) || "",
        clientWidth: document.documentElement.clientWidth,
        innerWidth: window.innerWidth,
        workspaceRight: Math.round(
          document.querySelector(".panelblock.mainblock")?.getBoundingClientRect().right || 0,
        ),
        title: document.title,
        url: location.href,
      }))
      .catch(() => null);

    console.error("Photopea diagnostics:", diagnostics);
    console.error("Photopea browser errors:", browserErrors.slice(0, 10));
    await page
      .screenshot({ path: "photopea-compatibility-failure.png", fullPage: true })
      .catch(() => {});
  }

  throw error;
} finally {
  await context.close();
}
