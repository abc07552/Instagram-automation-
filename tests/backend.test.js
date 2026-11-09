import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp, readConfig } from "../server/app.js";
import { Store } from "../server/store.js";

const owner = "test-owner-password-not-a-real-secret";
const token = "TEST_ONLY_META_CREDENTIAL_DO_NOT_USE";
const secret = "test-app-secret-not-a-real-credential";
const account = {
  id: "123456789",
  username: "test.creator",
  name: "Test Creator",
};
const env = {
  PUBLIC_BASE_URL: "http://localhost:3000",
  META_APP_ID: "1234",
  META_APP_SECRET: secret,
  META_LOGIN_CONFIG_ID: "9876",
  ADMIN_PASSWORD: owner,
  TOKEN_ENCRYPTION_KEY: "test-only-encryption-material-at-least-32-characters",
};

async function fixture(t, options = {}) {
  const dir = await mkdtemp(join(tmpdir(), "bloom-backend-"));
  let clock = Date.now();
  const calls = [];
  const config = readConfig({
    ...env,
    DATABASE_PATH: join(dir, "store.sqlite"),
    ...options.env,
  });
  const fetcher = async (raw, init) => {
    const url = new URL(raw);
    calls.push({ url, init });
    if (options.fail)
      return Response.json(
        {
          error: {
            code: options.fail,
            message: `DO NOT LEAK ${token} ${secret}`,
          },
        },
        { status: 400 },
      );
    if (url.pathname.endsWith("/oauth/access_token"))
      return Response.json({ access_token: token, expires_in: 3600 });
    assert.equal(init.headers.Authorization, `Bearer ${token}`);
    assert.equal(url.searchParams.has("access_token"), false);
    assert.equal(url.searchParams.has("appsecret_proof"), true);
    if (url.pathname.endsWith("/me/assigned_instagram_accounts")) {
      return Response.json({ data: options.accounts || [account] });
    }
    if (url.pathname.endsWith("/me/permissions"))
      return Response.json({ success: true });
    throw new Error("Unexpected provider path");
  };
  const { app, store } = createApp({ config, fetcher, now: () => clock });
  const server = await new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = "";
  const request = (path, opts = {}) =>
    fetch(base + path, {
      redirect: "manual",
      ...opts,
      headers: { ...(cookie ? { Cookie: cookie } : {}), ...opts.headers },
    });
  const post = (path, body = {}, origin = config.baseUrl) =>
    request(path, {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  async function login(rememberDevice = false) {
    const response = await post("/api/session", {
      password: owner,
      rememberDevice,
    });
    assert.equal(response.status, 200);
    cookie = response.headers.get("set-cookie").split(";")[0];
    return response;
  }
  async function begin() {
    const response = await request("/auth/instagram/start");
    assert.equal(response.status, 302);
    return new URL(response.headers.get("location"));
  }
  async function authorize() {
    await login();
    const url = await begin();
    const response = await request(
      `/auth/instagram/callback?state=${url.searchParams.get("state")}&code=test-only-code`,
    );
    assert.equal(response.status, 303);
    return response;
  }
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    store.close();
    await rm(dir, { recursive: true, force: true });
  });
  return {
    request,
    post,
    login,
    begin,
    authorize,
    store,
    config,
    calls,
    tick: (ms) => {
      clock += ms;
    },
    clearCookie: () => {
      cookie = "";
    },
  };
}

test("config validates HTTPS, URL shape, required credentials, and version", () => {
  assert.equal(readConfig(env).ready, true);
  assert.throws(() => readConfig({ ...env, NODE_ENV: "production" }), /HTTPS/);
  assert.throws(
    () =>
      readConfig({ ...env, PUBLIC_BASE_URL: "https://site.example/subpath" }),
    /origin/,
  );
  assert.throws(
    () => readConfig({ ...env, META_API_VERSION: "v26.0/evil" }),
    /version/i,
  );
  assert.equal(
    readConfig({ RENDER_EXTERNAL_URL: "https://assigned.example" }).callbackUrl,
    "https://assigned.example/auth/instagram/callback",
  );
  assert.equal(readConfig({}).ready, false);
});

test("owner gate, CSRF/origin protection, cookie settings, and session expiry", async (t) => {
  const f = await fixture(t);
  const publicResponse = await f.request("/api/connection");
  assert.deepEqual(await publicResponse.json(), {
    backend: true,
    storageMode: "local",
    configured: true,
    authenticated: false,
    connected: false,
  });
  assert.equal(
    (
      await f.post(
        "/api/session",
        { password: owner },
        "https://attacker.example",
      )
    ).status,
    403,
  );
  assert.equal(
    (await f.post("/api/session", { password: "wrong" })).status,
    401,
  );
  assert.equal((await f.request("/api/instagram/accounts")).status, 401);
  const login = await f.login();
  const cookie = login.headers.get("set-cookie");
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.equal(
    (
      await f.post(
        "/api/instagram/connect",
        { accountId: account.id },
        "https://attacker.example",
      )
    ).status,
    403,
  );
  f.tick(8 * 60 * 60 * 1000 + 1);
  assert.equal((await f.request("/auth/instagram/start")).status, 401);
});

test("production cookies are Secure and connection settings remain private", async (t) => {
  const f = await fixture(t, {
    env: { NODE_ENV: "production", PUBLIC_BASE_URL: "https://bloom.example" },
  });
  const response = await f.login();
  assert.match(response.headers.get("set-cookie"), /^__Host-bloom_session=/);
  assert.match(response.headers.get("set-cookie"), /; Secure/);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.match(
    response.headers.get("content-security-policy"),
    /frame-ancestors 'none'/,
  );
});

test("Unified Login URL matches selected configuration without secrets or duplicate scope", async (t) => {
  const f = await fixture(t);
  await f.login();
  const url = await f.begin();
  assert.equal(url.origin, "https://www.facebook.com");
  assert.equal(url.searchParams.get("config_id"), "9876");
  assert.equal(url.searchParams.get("client_id"), "1234");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("redirect_uri"), f.config.callbackUrl);
  assert.equal(url.pathname, "/dialog/oauth");
  assert.equal(url.searchParams.has("prompt"), false);
  assert.equal(url.searchParams.has("display"), false);
  assert.equal(url.searchParams.get("override_default_response_type"), "true");
  assert.equal(url.searchParams.has("scope"), false);
  assert.equal(url.href.includes(secret), false);
  assert.equal(url.searchParams.get("state").length, 64);
  const status = await (await f.request("/api/connection")).json();
  assert.deepEqual(status.login, { appId: "1234", configId: "9876" });
  assert.equal(JSON.stringify(status).includes(secret), false);
});

test("OAuth rejects foreign, missing, expired, and replayed state before any provider calls", async (t) => {
  const f = await fixture(t);
  await f.login();
  const url = await f.begin();
  assert.equal(
    (await f.request("/auth/instagram/callback?state=wrong&code=x")).status,
    400,
  );
  assert.equal(f.calls.length, 0);
  const response = await f.request(
    `/auth/instagram/callback?state=${url.searchParams.get("state")}&code=x`,
  );
  assert.equal(response.status, 303);
  assert.equal(
    (
      await f.request(
        `/auth/instagram/callback?state=${url.searchParams.get("state")}&code=x`,
      )
    ).status,
    400,
  );
  const next = await f.begin();
  f.tick(10 * 60 * 1000 + 1);
  assert.equal(
    (
      await f.request(
        `/auth/instagram/callback?state=${next.searchParams.get("state")}&code=x`,
      )
    ).status,
    400,
  );
  f.clearCookie();
  assert.equal(
    (
      await f.request(
        `/auth/instagram/callback?state=${next.searchParams.get("state")}&code=x`,
      )
    ).status,
    400,
  );
});

test("owner must explicitly select an assigned account; responses never disclose token", async (t) => {
  const f = await fixture(t);
  const response = await f.authorize();
  assert.match(response.headers.get("location"), /connection=choose/);
  assert.equal(f.store.connection(), null);
  const accountsResponse = await f.request("/api/instagram/accounts");
  assert.deepEqual(await accountsResponse.json(), { accounts: [account] });
  assert.equal(
    (await f.post("/api/instagram/connect", { accountId: "other" })).status,
    400,
  );
  const connect = await f.post("/api/instagram/connect", {
    accountId: account.id,
  });
  const connectionBody = await connect.text();
  assert.equal(connect.status, 200);
  assert.equal(connectionBody.includes(token), false);
  const statusResponse = await f.request("/api/connection");
  const statusText = await statusResponse.text();
  assert.equal(statusText.includes(token), false);
  assert.equal(statusText.includes(secret), false);
  const status = JSON.parse(statusText);
  assert.equal(status.connected, true);
  assert.deepEqual(status.capabilities, { publishing: false, insights: false });
  assert.equal((await f.request("/api/instagram/accounts")).status, 409);
  assert.equal((await f.request("/api/instagram/verify")).status, 200);
  f.tick(3600001);
  assert.equal(
    (await (await f.request("/api/connection")).json()).reconnectRequired,
    true,
  );
});

test("tokens are authenticated-encrypted at rest and persist across Store instances", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "bloom-store-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const dbPath = join(dir, "db.sqlite");
  let store = new Store(dbPath, env.TOKEN_ENCRYPTION_KEY);
  store.connect({ token, account });
  const row = store.db.prepare("SELECT payload FROM connection").get();
  assert.equal(row.payload.includes(token), false);
  store.close();
  assert.equal((await readFile(dbPath)).includes(Buffer.from(token)), false);
  store = new Store(dbPath, env.TOKEN_ENCRYPTION_KEY);
  assert.equal(store.connection().token, token);
  store.close();
  const wrongKey = new Store(dbPath, "different-encryption-key");
  assert.throws(() => wrongKey.connection());
  wrongKey.close();
});

test("cancelled login is safe, does not bind an account, and consumes state", async (t) => {
  const f = await fixture(t);
  await f.login();
  const url = await f.begin();
  const response = await f.request(
    `/auth/instagram/callback?state=${url.searchParams.get("state")}&error=access_denied`,
  );
  assert.match(response.headers.get("location"), /connection=denied/);
  assert.equal(f.calls.length, 0);
  assert.equal(f.store.connection(), null);
});

test("provider failures are redacted and do not save credentials", async (t) => {
  const f = await fixture(t, { fail: 190 });
  const response = await f.authorize();
  assert.match(response.headers.get("location"), /connection=expired/);
  assert.equal(f.store.connection(), null);
  assert.equal(
    (await (await f.request("/api/connection")).text()).includes(token),
    false,
  );
});

test("unassigned and expired pending accounts cannot be connected", async (t) => {
  const empty = await fixture(t, { accounts: [] });
  assert.match(
    (await empty.authorize()).headers.get("location"),
    /connection=no_accounts/,
  );
  assert.equal(empty.store.connection(), null);
  const f = await fixture(t);
  await f.authorize();
  f.tick(10 * 60 * 1000 + 1);
  assert.equal(
    (await f.post("/api/instagram/connect", { accountId: account.id })).status,
    409,
  );
});

test("disconnect deletes credential and logout invalidates the owner session", async (t) => {
  const f = await fixture(t);
  await f.authorize();
  await f.post("/api/instagram/connect", { accountId: account.id });
  const response = await f.post("/api/instagram/disconnect");
  assert.deepEqual(await response.json(), { connected: false, revoked: true });
  assert.equal(f.store.connection(), null);
  assert.equal((await f.post("/api/logout")).status, 200);
  assert.equal((await f.request("/api/instagram/accounts")).status, 401);
});

test("static hosting serves the built interface but not server, env, database, or Git files", async (t) => {
  const f = await fixture(t);
  assert.equal((await f.request("/")).status, 200);
  assert.equal((await f.request("/script.js")).status, 200);
  for (const path of [
    "/.env",
    "/.git/config",
    "/server/app.js",
    "/data/bloom.sqlite",
    "/api/missing",
  ]) {
    assert.equal((await f.request(path)).status, 404, path);
  }
});

test("free-testing mode is visible before and after login without exposing credentials", async (t) => {
  const f = await fixture(t, { env: { STORAGE_MODE: "ephemeral" } });
  assert.equal(
    (await (await f.request("/healthz")).json()).storageMode,
    "ephemeral",
  );
  assert.equal(
    (await (await f.request("/api/connection")).json()).storageMode,
    "ephemeral",
  );
  await f.authorize();
  await f.post("/api/instagram/connect", { accountId: account.id });
  const response = await f.request("/api/connection");
  const data = await response.json();
  assert.equal(data.storageMode, "ephemeral");
  assert.equal(data.connected, true);
  assert.deepEqual(data.capabilities, { publishing: false, insights: false });
  assert.equal(JSON.stringify(data).includes(token), false);
});

test("privacy and deletion instructions are public without exposing account credentials", async (t) => {
  const f = await fixture(t);
  for (const [path, title] of [
    ["/privacy.html", "Privacy policy"],
    ["/data-deletion.html", "Data-deletion instructions"],
  ]) {
    const response = await f.request(path);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type"), /text\/html/);
    assert.equal(response.headers.get("set-cookie"), null);
    const body = await response.text();
    assert.match(body, new RegExp(title));
    assert.match(body, /mailto:abc075528@gmail\.com/);
    assert.match(body, /href="\.\/legal\.css"/);
    assert.equal(body.includes(token), false);
    assert.equal(body.includes(secret), false);
    assert.equal(body.includes(owner), false);
    assert.doesNotMatch(body, /<script[\s>]/i);
  }
  const response = await f.request("/legal.css");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/css/);
});

test("remember-device uses matching fixed 30-day cookie and server expiry, while normal sessions remain 8 hours", async (t) => {
  const f = await fixture(t);
  const normal = await f.login();
  assert.match(normal.headers.get("set-cookie"), /Max-Age=28800;/);
  const response = await f.login(true);
  assert.match(response.headers.get("set-cookie"), /Max-Age=2592000;/);
  assert.match(response.headers.get("set-cookie"), /HttpOnly/);
  assert.match(response.headers.get("set-cookie"), /SameSite=Lax/);
  const expires = (await (await f.request("/api/connection")).json())
    .sessionExpiresAt;
  f.tick(9 * 60 * 60 * 1000);
  const afterNineHours = await (await f.request("/api/connection")).json();
  assert.equal(afterNineHours.authenticated, true);
  assert.equal(afterNineHours.sessionExpiresAt, expires);
  f.tick(30 * 24 * 60 * 60 * 1000 - 9 * 60 * 60 * 1000 + 1);
  assert.equal(
    (await (await f.request("/api/connection")).json()).authenticated,
    false,
  );
  assert.equal((await f.request("/auth/instagram/start")).status, 401);
});

test("remember-device opt-in is strict and remembered sessions are revoked on lock", async (t) => {
  const f = await fixture(t, {
    env: { NODE_ENV: "production", PUBLIC_BASE_URL: "https://bloom.example" },
  });
  const misleading = await f.post("/api/session", {
    password: owner,
    rememberDevice: "true",
  });
  assert.match(misleading.headers.get("set-cookie"), /Max-Age=28800;/);
  const response = await f.login(true);
  const raw = response.headers.get("set-cookie").split(";")[0].split("=")[1];
  assert.match(response.headers.get("set-cookie"), /^__Host-bloom_session=/);
  assert.match(response.headers.get("set-cookie"), /; Secure/);
  const locked = await f.post("/api/logout");
  assert.equal(locked.status, 200);
  assert.match(locked.headers.get("set-cookie"), /Expires=Thu, 01 Jan 1970/);
  assert.equal(f.store.session(raw, Date.now()), undefined);
  assert.equal((await f.request("/auth/instagram/start")).status, 401);
});

test("remembered sessions and encrypted connections survive reopening the same durable database but not replacing it", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "bloom-remember-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const dbPath = join(dir, "store.sqlite");
  const raw = "test-only-session-id-never-a-password";
  const now = Date.now();
  let store = new Store(dbPath, env.TOKEN_ENCRYPTION_KEY);
  store.newSession(raw, now, true);
  store.connect({ token, account });
  const stored = store.db.prepare("SELECT * FROM sessions").get();
  assert.notEqual(stored.id, raw);
  assert.equal(JSON.stringify(stored).includes(owner), false);
  store.close();
  store = new Store(dbPath, env.TOKEN_ENCRYPTION_KEY);
  assert(store.session(raw, now + 24 * 60 * 60 * 1000));
  assert.equal(store.connection().token, token);
  store.close();
  const replacement = new Store(":memory:", env.TOKEN_ENCRYPTION_KEY);
  assert.equal(replacement.session(raw, now), undefined);
  assert.equal(replacement.connection(), null);
  replacement.close();
});
