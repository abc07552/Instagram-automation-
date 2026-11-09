const { chromium } = require("@playwright/test");
const assert = require("node:assert/strict");
const { pathToFileURL } = require("node:url");
const path = require("node:path");

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    headless: true,
  });
  try {
    for (const file of ["index.html", "dist/index.html"]) {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 900 },
      });
      const failures = [];
      page.on("pageerror", (error) => failures.push(error.message));
      // There must be no framework, CDN, font, or API requests to the network.
      await page.route(/^https?:/, (route) => {
        failures.push(`External request: ${route.request().url()}`);
        return route.abort();
      });
      await page.goto(pathToFileURL(path.resolve(file)).href);
      await page
        .getByRole("heading", { name: /Your creative command center/ })
        .waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert(
        await page
          .locator(".post-thumbnail img")
          .evaluateAll((images) =>
            images.every((img) => img.complete && img.naturalWidth > 0),
          ),
        `${file}: local images load`,
      );
      await page
        .getByRole("button", { name: "Create content", exact: true })
        .click();
      await page
        .getByLabel("Content title")
        .fill("<img src=x onerror=alert(1)>");
      await page
        .getByLabel("Caption", { exact: true })
        .fill("A harmless literal title.");
      await page
        .getByRole("button", { name: "Save as draft", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Content planner", exact: true })
        .click();
      await page
        .getByRole("heading", {
          name: "<img src=x onerror=alert(1)>",
          exact: true,
        })
        .waitFor();
      assert.equal(
        await page.locator('img[src="x"]').count(),
        0,
        "User titles are escaped",
      );
      await page
        .getByRole("button", { name: "Create content", exact: true })
        .click();
      await page.keyboard.press("Escape");
      assert.equal(
        await page.getByRole("dialog").count(),
        0,
        "Escape dismisses dialog",
      );
      await page.close();
    }
    console.log(
      "PASS: source and built interface work directly from file://, load local assets without network, escape user content, and dismiss dialogs with Escape.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
