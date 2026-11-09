import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import {
  PostgresStore,
  postgresOptions,
  StorageUnavailableError,
} from "../server/postgres-store.js";
import { createApp, readConfig } from "../server/app.js";
import { localStore } from "../server/storage.js";
import { hash, REMEMBERED_SESSION_TTL } from "../server/credentials.js";

const secret = "TEST_ONLY_database_encryption_material_not_live";
const owner = "TEST_ONLY_private_owner_password";
const credential = "TEST_ONLY_Meta_token_not_live";
const databaseUrl =
  "postgresql://test_owner:TEST_ONLY_password@db.example/bloom?sslmode=require&channel_binding=require";
const account = { id: "12345", username: "test_creator", name: "Test Creator" };
const options = {
  STORAGE_MODE: "external",
  DATABASE_URL: databaseUrl,
  TOKEN_ENCRYPTION_KEY: secret,
  ADMIN_PASSWORD: owner,
  META_APP_ID: "1234",
  META_APP_SECRET: "TEST_ONLY_meta_secret",
  META_LOGIN_CONFIG_ID: "4321",
};

// PGlite runs real PostgreSQL semantics locally, not a wire/TLS provider test.
function poolFor(engine) {
  return {
    async query(sql, params = []) {
      if (sql.includes("CREATE SCHEMA")) {
        await engine.exec(sql);
        return { rows: [] };
      }
      return engine.query(sql, params);
    },
    end: () => engine.close(),
  };
}

test("external configuration enforces verified TLS, bounded pools and no silent SQLite fallback", () => {
  const opts = postgresOptions(databaseUrl);
  assert.deepEqual(opts.ssl, { rejectUnauthorized: true });
  assert.equal(new URL(opts.connectionString).search, "");
  assert.equal(opts.max, 3);
  assert.equal(opts.query_timeout, 10000);
  assert.equal(
    opts.statement_timeout,
    undefined,
    "Do not send unsupported startup settings to PgBouncer",
  );
  for (const raw of [
    "",
    "https://db.example",
    "postgres://test_owner@db.example/bloom",
    databaseUrl.replace("sslmode=require", "sslmode=disable"),
    databaseUrl + "&sslrootcert=system",
  ]) {
    assert.throws(() => postgresOptions(raw));
  }
  assert.throws(
    () => readConfig({ ...options, DATABASE_URL: "" }),
    /DATABASE_URL/,
  );
  assert.throws(
    () => readConfig({ ...options, TOKEN_ENCRYPTION_KEY: "" }),
    /TOKEN_ENCRYPTION_KEY/,
  );
  assert.throws(
    () => readConfig({ ...options, STORAGE_MODE: "ephemeral" }),
    /fallback is disabled/,
  );
  const config = readConfig(options);
  assert.equal(config.storageMode, "external");
  assert.throws(() => localStore(config), /fallback is disabled/);
  assert.throws(() => createApp({ config }), /fallback is disabled/);
});

test("PostgreSQL retains hashed remembered sessions and encrypted tokens through engine restart", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "bloom-pg-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const path = join(dir, "db");
  let engine = new PGlite(path);
  let store = await new PostgresStore(poolFor(engine), secret).init();
  const now = Date.now();
  await store.newSession("test-raw-cookie", now, true);
  await store.startOAuth(hash("test-raw-cookie"), "test-oauth-state", now);
  const [first, replay] = await Promise.all([
    store.consumeOAuth(hash("test-raw-cookie"), hash("test-oauth-state"), now),
    store.consumeOAuth(hash("test-raw-cookie"), hash("test-oauth-state"), now),
  ]);
  assert.equal(
    Number(first) + Number(replay),
    1,
    "atomic single-use OAuth state",
  );
  await store.pending(
    hash("test-raw-cookie"),
    { token: credential, accounts: [account] },
    now,
  );
  await store.connect({ token: credential, account });
  const storedSession = (
    await engine.query("SELECT * FROM bloom_private.sessions")
  ).rows[0];
  const encrypted = (
    await engine.query("SELECT payload FROM bloom_private.connection")
  ).rows[0].payload;
  assert.notEqual(storedSession.id, "test-raw-cookie");
  assert.equal(encrypted.includes(credential), false);
  assert.equal(storedSession.pending.includes(credential), false);
  assert.equal(JSON.stringify(storedSession).includes(owner), false);
  await store.close();
  engine = new PGlite(path);
  store = await new PostgresStore(poolFor(engine), secret).init();
  try {
    assert.equal((await store.connection()).token, credential);
    const session = await store.session(
      "test-raw-cookie",
      now + 24 * 60 * 60 * 1000,
    );
    assert.equal(session.expires, now + REMEMBERED_SESSION_TTL);
    assert.equal(typeof session.pending_expires, "number");
    assert.equal(
      await store.session("test-raw-cookie", now + REMEMBERED_SESSION_TTL + 1),
      undefined,
    );
    const wrongKey = new PostgresStore(store.pool, "wrong-key");
    await assert.rejects(() => wrongKey.connection());
    await store.disconnect();
    assert.equal(await store.connection(), null);
    assert.equal((await store.session("test-raw-cookie", now)).pending, null);
    await store.deleteSession("test-raw-cookie");
    assert.equal(await store.session("test-raw-cookie", now), undefined);
    const privileges = await engine.query(
      "SELECT has_schema_privilege('public', 'bloom_private', 'USAGE') AS allowed",
    );
    assert.equal(privileges.rows[0].allowed, false);
  } finally {
    await store.close();
  }
});

test("external database supports full owner/OAuth lifecycle and survives app recreation without leaking credentials", async () => {
  const engine = new PGlite();
  const store = await new PostgresStore(poolFor(engine), secret).init();
  const config = readConfig(options);
  let cookie = "",
    server,
    base;
  let calls = 0;
  const fetcher = async (raw) => {
    calls++;
    return new URL(raw).pathname.endsWith("/oauth/access_token")
      ? Response.json({ access_token: credential, expires_in: 3600 })
      : Response.json({ data: [account], success: true });
  };
  async function serve() {
    const { app } = createApp({ config, store, fetcher });
    server = await new Promise((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    base = `http://127.0.0.1:${server.address().port}`;
    config.baseUrl = base;
    config.callbackUrl = `${base}/auth/instagram/callback`;
  }
  const request = (path, extra = {}) =>
    fetch(base + path, {
      redirect: "manual",
      ...extra,
      headers: { Cookie: cookie, ...extra.headers },
    });
  const post = (path, body = {}) =>
    request(path, {
      method: "POST",
      headers: { Origin: base, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  try {
    await serve();
    const publicStatus = await (await request("/api/connection")).json();
    assert.equal(publicStatus.storageMode, "external");
    assert.equal(publicStatus.databaseUrl, undefined);
    assert.equal(
      (await post("/api/session", { password: "wrong" })).status,
      401,
    );
    const login = await post("/api/session", {
      password: owner,
      rememberDevice: true,
    });
    assert.equal(login.status, 200);
    cookie = login.headers.get("set-cookie").split(";")[0];
    const begin = await request("/auth/instagram/start");
    const state = new URL(begin.headers.get("location")).searchParams.get(
      "state",
    );
    const callback = `/auth/instagram/callback?state=${state}&code=test-only`;
    const statuses = await Promise.all([request(callback), request(callback)]);
    assert.deepEqual(statuses.map((r) => r.status).sort(), [303, 400]);
    assert.equal(
      calls,
      2,
      "one exchange and one account discovery despite concurrent callbacks",
    );
    const found = await (await request("/api/instagram/accounts")).json();
    assert.deepEqual(found.accounts, [account]);
    assert.equal(
      (await post("/api/instagram/connect", { accountId: "foreign" })).status,
      400,
    );
    assert.equal(
      (await post("/api/instagram/connect", { accountId: account.id })).status,
      200,
    );
    await new Promise((resolve) => server.close(resolve));
    await serve();
    const status = await (await request("/api/connection")).json();
    assert.equal(status.authenticated, true);
    assert.equal(status.connected, true);
    for (const response of [status, publicStatus, found]) {
      const serialized = JSON.stringify(response);
      for (const value of [credential, databaseUrl, secret, owner])
        assert.equal(serialized.includes(value), false);
    }
    assert.equal((await request("/api/instagram/verify")).status, 200);
    assert.equal((await post("/api/instagram/disconnect")).status, 200);
    assert.equal(await store.connection(), null);
    assert.equal((await post("/api/logout")).status, 200);
    assert.equal((await request("/auth/instagram/start")).status, 401);
  } finally {
    if (server?.listening)
      await new Promise((resolve) => server.close(resolve));
    await store.close();
  }
});

test("database outages fail closed with redacted errors while static privacy pages stay available", async () => {
  const store = new PostgresStore(
    {
      query: async () => {
        throw new Error(`PRIVATE ${databaseUrl} ${secret}`);
      },
      end: async () => {},
    },
    secret,
  );
  await assert.rejects(() => store.init(), StorageUnavailableError);
  const { app } = createApp({ config: readConfig(options), store });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const path of ["/healthz", "/api/connection"]) {
      const response = await fetch(base + path);
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), { error: "storage_unavailable" });
    }
    const locked = await fetch(base + "/api/connection", {
      headers: { Cookie: "bloom_session=test-cookie" },
    });
    assert.equal(locked.status, 503);
    assert.equal((await locked.text()).includes(databaseUrl), false);
    for (const path of ["/", "/privacy.html", "/data-deletion.html"])
      assert.equal((await fetch(base + path)).status, 200);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
