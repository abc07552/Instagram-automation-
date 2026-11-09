const { chromium: playwright } = require("@playwright/test");
const assert = require("node:assert/strict");
(async () => {
  let executablePath = process.env.CHROMIUM_PATH;
  let args = [];
  if (!executablePath) {
    try {
      const module = require("@sparticuz/chromium");
      const chromium = module.default || module;
      executablePath = await chromium.executablePath();
      args = chromium.args;
    } catch {
      /* Use Playwright's installed browser. */
    }
  }
  const browser = await playwright.launch({
    executablePath,
    args,
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:5173");
  await page
    .getByRole("heading", { name: /Your creative command center/ })
    .waitFor();
  await page.screenshot({ path: "/tmp/bloom-desktop.png", fullPage: true });
  await page
    .getByRole("button", { name: "Create content", exact: true })
    .click();
  await page.getByLabel("Content title").fill("My first test reel");
  await page
    .getByLabel("Caption", { exact: true })
    .fill("A small moment worth sharing.");
  await page.getByRole("button", { name: "Schedule content" }).click();
  await page
    .getByRole("button", { name: "Content planner", exact: true })
    .click();
  await page.getByRole("heading", { name: "My first test reel" }).waitFor();
  await page.reload();
  await page
    .getByRole("button", { name: "Content planner", exact: true })
    .click();
  await page.getByRole("heading", { name: "My first test reel" }).waitFor();
  await page.getByPlaceholder("Search your content").fill("My first test reel");
  assert.equal(await page.locator(".planner-post").count(), 1);
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  assert.equal(await page.locator(".planner-post").count(), 0);
  await page
    .getByRole("button", { name: "AI assistant", exact: false })
    .click();
  await page
    .getByRole("button", { name: "Analyze my performance", exact: true })
    .click();
  await page.locator(".message.assistant").waitFor();
  await page.locator(".idea-generator .form-input").fill("photography");
  await page.getByRole("button", { name: "Generate ideas" }).click();
  await page
    .getByRole("heading", { name: "A day in the world of photography" })
    .waitFor();
  await page
    .locator(".generated-idea")
    .first()
    .getByRole("button", { name: "Save idea" })
    .click();
  await page.getByRole("button", { name: "Media library" }).click();
  await page
    .getByText("A day in the world of photography", { exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Analytics", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export report" }).click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), "bloom-performance-report.json");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".mobile-toggle").click();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.screenshot({ path: "/tmp/bloom-mobile.png", fullPage: true });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "No horizontal overflow",
  );
  assert.deepEqual(errors, []);
  await browser.close();
  console.log(
    "PASS: dashboard, create, persistence, search, delete, assistant, idea generator, saved ideas, report export, mobile navigation, and no runtime errors.",
  );
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
