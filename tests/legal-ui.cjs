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
    for (const directory of ["", "dist/"]) {
      for (const width of [390, 1280]) {
        const page = await browser.newPage({
          viewport: { width, height: 900 },
        });
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.route(/^https?:/, (route) => {
          errors.push(`Unexpected network request: ${route.request().url()}`);
          return route.abort();
        });
        await page.goto(
          pathToFileURL(path.resolve(directory, "privacy.html")).href,
        );
        await page
          .getByRole("heading", {
            level: 1,
            name: "Privacy policy",
            exact: true,
          })
          .waitFor();
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.locator("script").count(), 0);
        assert(
          (await page.locator('a[href="mailto:abc075528@gmail.com"]').count()) >
            0,
        );
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          "Privacy layout must not overflow",
        );
        assert(
          await page.evaluate(() =>
            getComputedStyle(document.body).fontFamily.includes("DM Sans"),
          ),
        );
        if (!directory && width === 390)
          await page.screenshot({
            path: "/tmp/bloom-privacy-mobile.png",
            fullPage: true,
          });
        await page
          .locator(".legal-footer")
          .getByRole("link", { name: "Data deletion", exact: true })
          .click();
        await page
          .getByRole("heading", {
            level: 1,
            name: "Data-deletion instructions",
          })
          .waitFor();
        await page
          .getByText(
            "This is an instructions page, not an automatic deletion callback.",
            { exact: true },
          )
          .waitFor();
        assert(
          (await page
            .locator('a[href^="mailto:abc075528@gmail.com"]')
            .count()) > 0,
        );
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          "Deletion layout must not overflow",
        );
        await page
          .locator(".legal-footer")
          .getByRole("link", { name: "Workspace", exact: true })
          .click();
        await page
          .getByRole("heading", { name: /A little inspiration/ })
          .waitFor();
        await page
          .locator(".workspace-legal-links")
          .getByRole("link", { name: "Privacy policy", exact: true })
          .click();
        await page
          .getByRole("heading", {
            level: 1,
            name: "Privacy policy",
            exact: true,
          })
          .waitFor();
        assert.deepEqual(errors, []);
        await page.close();
      }
    }
    console.log(
      "PASS: source and built public policy/deletion pages on mobile and desktop, local assets, contact links, workspace navigation, no overflow, and no external requests.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
