import crypto from "node:crypto";
import { env } from "./env";

// AES-256-GCM encryption for secrets at rest (SMTP passwords).
// Stored format: base64(iv).base64(authTag).base64(ciphertext)

function getKey(): Buffer {
  const raw = env.encryptionKey;
  // Accept base64 or hex; must decode to exactly 32 bytes.
  let key: Buffer;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    key = Buffer.from(raw, "hex");
  } else {
    key = Buffer.from(raw, "base64");
  }
  if (key.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must decode to 32 bytes (use `openssl rand -base64 32`)"
    );
  }
  return key;
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    tag.toString("base64"),
    ct.toString("base64"),
  ].join(".");
}

export function decrypt(payload: string): string {
  const key = getKey();
  const parts = payload.split(".");
  // ciphertext (parts[2]) is legitimately empty when the plaintext was empty,
  // so validate the structure by part count, not truthiness.
  if (parts.length !== 3 || !parts[0] || !parts[1]) {
    throw new Error("Invalid encrypted payload");
  }
  const [ivB64, tagB64, ctB64] = parts;
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const pt = Buffer.concat([
    decipher.update(Buffer.from(ctB64, "base64")),
    decipher.final(),
  ]);
  return pt.toString("utf8");
}
