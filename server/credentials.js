import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

export const hash = (value) => createHash("sha256").update(value).digest("hex");

export const SESSION_TTL = 8 * 60 * 60 * 1000;
export const REMEMBERED_SESSION_TTL = 30 * 24 * 60 * 60 * 1000;

export class CredentialCipher {
  constructor(secret) {
    this.key = secret ? createHash("sha256").update(secret).digest() : null;
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
}
