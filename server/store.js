import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

export const hash = (value) => createHash("sha256").update(value).digest("hex");

// One owner, one connection. SQLite must live on a persistent, private disk.
export class Store {
  constructor(path, secret) {
    if (path !== ":memory:")
      mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    this.key = secret ? createHash("sha256").update(secret).digest() : null;
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
  encrypt(value) {
    if (!this.key) throw new Error("Encryption is not configured");
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const data = Buffer.concat([
      cipher.update(JSON.stringify(value), "utf8"),
      cipher.final(),
    ]);
    return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64");
  }
  decrypt(value) {
    if (!this.key) throw new Error("Encryption is not configured");
    const buffer = Buffer.from(value, "base64");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      this.key,
      buffer.subarray(0, 12),
    );
    decipher.setAuthTag(buffer.subarray(12, 28));
    return JSON.parse(
      Buffer.concat([
        decipher.update(buffer.subarray(28)),
        decipher.final(),
      ]).toString(),
    );
  }
  newSession(raw, now) {
    this.db.prepare("DELETE FROM sessions WHERE expires <= ?").run(now);
    this.db
      .prepare("INSERT INTO sessions (id, expires) VALUES (?, ?)")
      .run(hash(raw), now + 8 * 60 * 60 * 1000);
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
  consumeOAuth(id) {
    this.db
      .prepare(
        "UPDATE sessions SET oauth_state = NULL, oauth_expires = NULL WHERE id = ?",
      )
      .run(id);
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
