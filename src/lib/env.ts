// Centralized environment access. Reads lazily so importing this module in the
// browser bundle (where these are undefined) doesn't throw at import time.

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

export const env = {
  get appUrl() {
    return process.env.APP_URL ?? "http://localhost:3000";
  },
  // Base URL used for images embedded in emails (served from the platform's
  // /email/*.png). Defaults to APP_URL; override with ASSET_BASE_URL if you host
  // the assets elsewhere (e.g. a CDN).
  get assetBase() {
    return process.env.ASSET_BASE_URL ?? this.appUrl;
  },
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get redisUrl() {
    return process.env.REDIS_URL ?? "redis://localhost:6379";
  },
  get sessionSecret() {
    return required("SESSION_SECRET");
  },
  get encryptionKey() {
    return required("ENCRYPTION_KEY");
  },
  get allowRegistration() {
    return (process.env.ALLOW_REGISTRATION ?? "true").toLowerCase() === "true";
  },
};
