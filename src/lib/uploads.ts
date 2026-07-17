import path from "node:path";
import fs from "node:fs/promises";

// Directory where uploaded images are stored. In Docker this is a mounted
// volume so uploads survive container rebuilds. Falls back to a local ./data
// folder for non-Docker dev.
export const UPLOADS_DIR =
  process.env.UPLOADS_DIR ?? path.join(process.cwd(), "data", "uploads");

const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export function extForType(mime: string): string | null {
  return ALLOWED[mime] ?? null;
}

export function contentTypeForExt(ext: string): string {
  const map: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
  };
  return map[ext.toLowerCase()] ?? "application/octet-stream";
}

// Only allow simple filenames (no path traversal).
export function safeName(name: string): string | null {
  if (!/^[A-Za-z0-9._-]+$/.test(name)) return null;
  return name;
}

export async function ensureUploadsDir(): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}
