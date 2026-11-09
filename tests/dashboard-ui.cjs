const { chromium } = require("@playwright/test");
const assert = require("node:assert/strict");
const { pathToFileURL } = require("node:url");
const path = require("node:path");

(async () => {
  const { createApp, readConfig } = await import("../server/app.js");
  const { Store } = await import("../server/store.js");
  const config = readConfig({
    TOKEN_ENCRYPTION_KEY: "test-only-dashboard-encryption-key-not-live",
  });
  const store = new Store(":memory:", config.encryptionKey);
  const { app } = createApp({ config, store });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    headless: true,
  });
  try {
    for (const width of [320, 390, 768, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 960 } });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(pathToFileURL(path.resolve("dist/index.html")).href);
      await page
        .getByRole("heading", { name: "Your creative command center." })
        .waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert.equal(
        await page.getByText("Local workspace", { exact: true }).count(),
        1,
      );
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${width}: no horizontal overflow`,
      );
      assert(
        await page
          .locator("img")
          .evaluateAll((images) =>
            images.every((i) => i.complete && i.naturalWidth),
          ),
        `${width}: images load`,
      );
      await page.getByRole("button", { name: "Plan something great" }).click();
      await page
        .getByRole("heading", { name: "Good content. Great timing." })
        .waitFor();
      await page
        .getByRole("button", { name: "Create content", exact: true })
        .click();
      await page.getByLabel("Content title").fill("Dashboard regression draft");
      await page
        .getByLabel("Caption", { exact: true })
        .fill("Saved locally, never falsely published.");
      await page
        .getByRole("button", { name: "Save as draft", exact: true })
        .click();
      if (width <= 640)
        await page.getByRole("button", { name: "Toggle navigation" }).click();
      await page.getByRole("button", { name: "Overview", exact: true }).click();
      // A shared rendering function must update counts after saving, not freeze the hero values.
      if (width > 1050) {
        assert.equal(
          await page.locator(".pulse-row").nth(0).locator("strong").innerText(),
          "04",
        );
        assert.equal(
          await page.locator(".pulse-row").nth(1).locator("strong").innerText(),
          "02",
        );
      }
      await page
        .getByRole("button", { name: "Connect Instagram", exact: true })
        .click();
      await page
        .getByText("This copy is running without a backend.", { exact: true })
        .waitFor();
      await page
        .getByText("Having trouble with Meta login?", { exact: true })
        .click();
      await page
        .getByRole("heading", {
          name: "“Invalid code for Instagram OpenID Connect”",
        })
        .waitFor();
      await page.keyboard.press("Escape");
      assert.equal(await page.getByRole("dialog").count(), 0);
      await page.screenshot({
        path: `/tmp/bloom-studio-${width}.png`,
        fullPage: true,
      });
      assert.deepEqual(errors, []);
      await page.close();
    }
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    let status = { backend: true, authenticated: false, configured: true };
    await page.route("**/api/connection", (route) =>
      route.fulfill({ json: status }),
    );
    await page.goto(base);
    await page.getByText("Owner locked", { exact: true }).waitFor();
    status = {
      backend: true,
      authenticated: true,
      configured: true,
      connected: true,
      account: { username: "<script>not-html</script>" },
    };
    await page.reload();
    await page.getByText("Instagram connected", { exact: true }).waitFor();
    assert.equal(
      await page.locator(".channel-copy strong").innerText(),
      "@<script>not-html</script> is connected.",
    );
    assert.equal(await page.locator(".channel-copy script").count(), 0);
    await page.getByText(/Analytics remain samples/).waitFor();
    status = {
      backend: true,
      authenticated: true,
      configured: true,
      reconnectRequired: true,
    };
    await page.reload();
    await page.getByText("Reconnect needed", { exact: true }).waitFor();
    await page.unroute("**/api/connection");
    let unavailable = true;
    await page.route("**/api/connection", (route) =>
      unavailable
        ? route.fulfill({
            status: 503,
            contentType: "text/html",
            body: "Waking up",
          })
        : route.fulfill({
            json: { backend: true, configured: true, authenticated: false },
          }),
    );
    await page.reload();
    await page.getByText("Service unavailable", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Connect Instagram", exact: true })
      .click();
    await page
      .getByText("Connection service unavailable", { exact: true })
      .waitFor();
    unavailable = false;
    await page.getByRole("button", { name: "Check service again" }).click();
    await page.getByLabel("Bloom owner password").waitFor();
    await page.getByText("Owner locked", { exact: true }).waitFor();
    console.log(
      "PASS: premium dashboard at 320/390/768/1440px, local draft counts/navigation, accessible help, escaped account names, truthful locked/connected/expired/unavailable states and service retry.",
    );
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
    store.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
