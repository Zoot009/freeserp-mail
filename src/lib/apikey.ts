import crypto from "node:crypto";

// API keys are shown to the user exactly once. We store only a SHA-256 hash
// plus a short human-readable prefix for the dashboard.

const KEY_BYTES = 24;

export function generateApiKey(): {
  raw: string;
  hash: string;
  prefix: string;
} {
  const secret = crypto.randomBytes(KEY_BYTES).toString("base64url");
  const raw = `ek_live_${secret}`;
  return {
    raw,
    hash: hashApiKey(raw),
    prefix: raw.slice(0, 12), // e.g. "ek_live_ab12"
  };
}

export function hashApiKey(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}
