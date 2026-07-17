import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { getSession } from "@/lib/session";
import { env } from "@/lib/env";
import {
  UPLOADS_DIR,
  MAX_UPLOAD_BYTES,
  extForType,
  ensureUploadsDir,
} from "@/lib/uploads";

export const runtime = "nodejs";

// POST /api/upload — dashboard-authed image upload. Returns a public URL that
// templates/branding can embed. (Serving is public via /api/uploads/[name].)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 413 });
  }
  const ext = extForType(file.type);
  if (!ext) {
    return NextResponse.json(
      { error: "Unsupported type (png, jpg, gif, webp, svg only)" },
      { status: 415 }
    );
  }

  await ensureUploadsDir();
  const name = `${randomUUID()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOADS_DIR, name), buf);

  return NextResponse.json({
    name,
    url: `${env.appUrl}/api/uploads/${name}`,
  });
}
