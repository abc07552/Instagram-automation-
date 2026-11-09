import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import {
  CredentialCipher,
  hash,
  SESSION_TTL,
  REMEMBERED_SESSION_TTL,
} from "./credentials.js";
export { hash, SESSION_TTL, REMEMBERED_SESSION_TTL } from "./credentials.js";

// One owner, one connection. Durable storage requires a persistent, private disk.
export class Store extends CredentialCipher {
  constructor(path, secret) {
    super(secret);
    if (path !== ":memory:")
      mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    this.db.exec(`
      PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY, expires INTEGER NOT NULL,
        oauth_state TEXT, oauth_expires INTEGER, pending TEXT, pending_expires INTEGER
      );
      CREATE TABLE IF NOT EXISTS connection (
        id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT NOT NULL
      );
    `);
  }
  newSession(raw, now, rememberDevice = false) {
    this.db.prepare("DELETE FROM sessions WHERE expires <= ?").run(now);
    this.db
      .prepare("INSERT INTO sessions (id, expires) VALUES (?, ?)")
      .run(
        hash(raw),
        now + (rememberDevice === true ? REMEMBERED_SESSION_TTL : SESSION_TTL),
      );
  }
  session(raw, now) {
    return raw
      ? this.db
          .prepare("SELECT * FROM sessions WHERE id = ? AND expires > ?")
          .get(hash(raw), now)
      : undefined;
  }
  deleteSession(raw) {
    if (raw)
      this.db.prepare("DELETE FROM sessions WHERE id = ?").run(hash(raw));
  }
  startOAuth(id, rawState, now) {
    this.db
      .prepare(
        "UPDATE sessions SET oauth_state = ?, oauth_expires = ?, pending = NULL, pending_expires = NULL WHERE id = ?",
      )
      .run(hash(rawState), now + 10 * 60 * 1000, id);
  }
  consumeOAuth(id, stateHash, now) {
    return (
      this.db
        .prepare(
          "UPDATE sessions SET oauth_state = NULL, oauth_expires = NULL WHERE id = ? AND oauth_state = ? AND oauth_expires > ? AND expires > ?",
        )
        .run(id, stateHash, now, now).changes === 1
    );
  }
  health() {
    this.db.prepare("SELECT 1").get();
  }
  pending(id, data, now) {
    this.db
      .prepare(
        "UPDATE sessions SET pending = ?, pending_expires = ? WHERE id = ?",
      )
      .run(this.encrypt(data), now + 10 * 60 * 1000, id);
  }
  clearPending(id) {
    this.db
      .prepare(
        "UPDATE sessions SET pending = NULL, pending_expires = NULL WHERE id = ?",
      )
      .run(id);
  }
  connect(data) {
    this.db
      .prepare("INSERT OR REPLACE INTO connection (id, payload) VALUES (1, ?)")
      .run(this.encrypt(data));
  }
  connection() {
    const row = this.db
      .prepare("SELECT payload FROM connection WHERE id = 1")
      .get();
    return row ? this.decrypt(row.payload) : null;
  }
  disconnect() {
    this.db.exec(
      "DELETE FROM connection; UPDATE sessions SET pending = NULL, pending_expires = NULL;",
    );
  }
  close() {
    this.db.close();
  }
}
