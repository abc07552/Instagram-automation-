const { chromium } = require("@playwright/test");
const assert = require("node:assert/strict");

(async () => {
  const { createApp, readConfig } = await import("../server/app.js");
  const { Store } = await import("../server/store.js");
  const password = "TEST_ONLY_owner_password_not_a_live_secret";
  const accessToken = "TEST_ONLY_Meta_token_never_sent_to_browser";
  const config = readConfig({
    PUBLIC_BASE_URL: "http://127.0.0.1:3000",
    META_APP_ID: "1234",
    META_APP_SECRET: "test-only-secret",
    META_LOGIN_CONFIG_ID: "4321",
    ADMIN_PASSWORD: password,
    TOKEN_ENCRYPTION_KEY: "test-only-random-encryption-value-not-a-live-key",
  });
  const store = new Store(":memory:", config.encryptionKey);
  const { app } = createApp({
    config,
    store,
    fetcher: async (url) => {
      const path = new URL(url).pathname;
      if (path.endsWith("/oauth/access_token"))
        return Response.json({ access_token: accessToken });
      if (path.endsWith("/me/permissions"))
        return Response.json({ success: true });
      return Response.json({
        data: [
          { id: "2345", username: "demo_test_creator", name: "Test Creator" },
        ],
      });
    },
  });
  const server = await new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  config.baseUrl = base;
  config.callbackUrl = `${base}/auth/instagram/callback`;
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    headless: true,
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base + "/?connect=1");
    await page.getByLabel("Bloom owner password").fill("wrong");
    await page
      .getByRole("button", { name: "Unlock connection settings" })
      .click();
    await page.getByRole("status").filter({ hasText: "incorrect" }).waitFor();
    await page.getByLabel("Bloom owner password").fill(password);
    await page
      .getByRole("button", { name: "Unlock connection settings" })
      .click();
    await page.getByLabel("Paste this exact Redirect URL into Meta").waitFor();
    assert.equal(
      await page.locator("#callback-url").inputValue(),
      config.callbackUrl,
    );
    await page.screenshot({
      path: "/tmp/bloom-backend-connection.png",
      fullPage: true,
    });
    let state;
    // Stop at the real server's redirect boundary: the sandbox cannot reach Meta.
    await page.route("**/auth/instagram/start", async (route) => {
      const response = await route.fetch({ maxRedirects: 0 });
      assert.equal(response.status(), 302);
      const login = new URL(response.headers().location);
      assert.equal(login.origin, "https://www.facebook.com");
      state = login.searchParams.get("state");
      return route.fulfill({
        contentType: "text/html",
        body: "<h1>Mock Meta authorization</h1>",
        status: 200,
      });
    });
    await page.getByRole("button", { name: "Continue with Meta" }).click();
    await page
      .getByRole("heading", { name: "Mock Meta authorization" })
      .waitFor();
    assert(state);
    await page.goto(`${config.callbackUrl}?state=${state}&code=test-only-code`);
    await page.getByRole("button", { name: "@demo_test_creator" }).click();
    await page.getByText("Connected", { exact: true }).waitFor();
    assert.equal((await page.content()).includes(accessToken), false);
    assert.equal(
      await page.evaluate(() =>
        JSON.stringify(localStorage).includes("TEST_ONLY"),
      ),
      false,
    );
    await page
      .getByRole("button", { name: "Verify access", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "Meta confirmed" })
      .waitFor();
    await page.getByRole("button", { name: "Disconnect", exact: true }).click();
    await page.getByRole("button", { name: "Continue with Meta" }).waitFor();
    assert.equal(store.connection(), null);
    await page.getByRole("button", { name: "Lock owner settings" }).click();
    await page.getByLabel("Bloom owner password").waitFor();
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: mobile owner login, callback display, mocked Meta round trip, explicit account selection, verification, disconnect, logout, and no token disclosure.",
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
