import pg from "pg";
import {
  CredentialCipher,
  hash,
  SESSION_TTL,
  REMEMBERED_SESSION_TTL,
} from "./credentials.js";

export class StorageUnavailableError extends Error {
  constructor() {
    super("storage_unavailable");
  }
}

// Never include a URL or the driver's raw message in an error or public response.
export function postgresOptions(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("DATABASE_URL must be a private PostgreSQL connection URL");
  }
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname ||
    !url.username ||
    !url.password ||
    url.pathname.length < 2 ||
    url.hash
  ) {
    throw new Error(
      "DATABASE_URL must include a PostgreSQL host, database, username, and password",
    );
  }
  const mode = url.searchParams.get("sslmode");
  if (mode && !["require", "verify-ca", "verify-full"].includes(mode)) {
    throw new Error("DATABASE_URL must require verified TLS");
  }
  for (const name of url.searchParams.keys()) {
    if (!["sslmode", "channel_binding"].includes(name)) {
      throw new Error(
        "DATABASE_URL has unsupported connection options; use the provider's standard pooled URL",
      );
    }
  }
  // pg's sslmode URL handling can override the explicit ssl object. Remove it
  // and always enforce certificate/hostname verification instead.
  url.search = "";
  return {
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: true },
    enableChannelBinding: true,
    max: 3,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    query_timeout: 10000,
    application_name: "bloom",
  };
}

const sessionRow = (row) =>
  row
    ? {
        ...row,
        expires: Number(row.expires),
        oauth_expires:
          row.oauth_expires === null ? null : Number(row.oauth_expires),
        pending_expires:
          row.pending_expires === null ? null : Number(row.pending_expires),
      }
    : undefined;

export class PostgresStore extends CredentialCipher {
  constructor(pool, secret) {
    super(secret);
    this.pool = pool;
  }
  async query(sql, params = []) {
    try {
      return await this.pool.query(sql, params);
    } catch {
      throw new StorageUnavailableError();
    }
  }
  async init() {
    // A dedicated schema avoids exposing tokens through public API schemas.
    // Use a dedicated database and database role; never grant public access.
    await this.query(`
      CREATE SCHEMA IF NOT EXISTS bloom_private;
      REVOKE ALL ON SCHEMA bloom_private FROM PUBLIC;
      CREATE TABLE IF NOT EXISTS bloom_private.sessions (
        id TEXT PRIMARY KEY, expires BIGINT NOT NULL,
        oauth_state TEXT, oauth_expires BIGINT, pending TEXT, pending_expires BIGINT
      );
      CREATE TABLE IF NOT EXISTS bloom_private.connection (
        id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT NOT NULL
      );
      REVOKE ALL ON bloom_private.sessions, bloom_private.connection FROM PUBLIC;
    `);
    return this;
  }
  async health() {
    await this.query("SELECT 1");
  }
  async newSession(raw, now, rememberDevice = false) {
    await this.query("DELETE FROM bloom_private.sessions WHERE expires <= $1", [
      now,
    ]);
    await this.query(
      "INSERT INTO bloom_private.sessions (id, expires) VALUES ($1, $2)",
      [
        hash(raw),
        now + (rememberDevice === true ? REMEMBERED_SESSION_TTL : SESSION_TTL),
      ],
    );
  }
  async session(raw, now) {
    if (!raw) return undefined;
    const result = await this.query(
      "SELECT * FROM bloom_private.sessions WHERE id = $1 AND expires > $2",
      [hash(raw), now],
    );
    return sessionRow(result.rows[0]);
  }
  async deleteSession(raw) {
    if (raw)
      await this.query("DELETE FROM bloom_private.sessions WHERE id = $1", [
        hash(raw),
      ]);
  }
  async startOAuth(id, rawState, now) {
    await this.query(
      "UPDATE bloom_private.sessions SET oauth_state = $1, oauth_expires = $2, pending = NULL, pending_expires = NULL WHERE id = $3",
      [hash(rawState), now + 10 * 60 * 1000, id],
    );
  }
  async consumeOAuth(id, stateHash, now) {
    const result = await this.query(
      "UPDATE bloom_private.sessions SET oauth_state = NULL, oauth_expires = NULL WHERE id = $1 AND oauth_state = $2 AND oauth_expires > $3 AND expires > $3 RETURNING id",
      [id, stateHash, now],
    );
    return result.rows.length === 1;
  }
  async pending(id, data, now) {
    await this.query(
      "UPDATE bloom_private.sessions SET pending = $1, pending_expires = $2 WHERE id = $3",
      [this.encrypt(data), now + 10 * 60 * 1000, id],
    );
  }
  async clearPending(id) {
    await this.query(
      "UPDATE bloom_private.sessions SET pending = NULL, pending_expires = NULL WHERE id = $1",
      [id],
    );
  }
  async connect(data) {
    await this.query(
      "INSERT INTO bloom_private.connection (id, payload) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload",
      [this.encrypt(data)],
    );
  }
  async connection() {
    const result = await this.query(
      "SELECT payload FROM bloom_private.connection WHERE id = 1",
    );
    return result.rows[0] ? this.decrypt(result.rows[0].payload) : null;
  }
  async disconnect() {
    // One statement: deleting credentials and pending authorizations is atomic.
    await this.query(
      "WITH deleted AS (DELETE FROM bloom_private.connection RETURNING id) UPDATE bloom_private.sessions SET pending = NULL, pending_expires = NULL",
    );
  }
  async close() {
    await this.pool.end();
  }
}

export async function openPostgres(config) {
  const pool = new pg.Pool(postgresOptions(config.databaseUrl));
  pool.on("error", () => {
    console.error("Bloom database connection interrupted (details redacted).");
  });
  const store = new PostgresStore(pool, config.encryptionKey);
  try {
    return await store.init();
  } catch {
    await pool.end().catch(() => {});
    throw new StorageUnavailableError();
  }
}
