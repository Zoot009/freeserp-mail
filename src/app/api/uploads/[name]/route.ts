import { NextResponse, type NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { UPLOADS_DIR, safeName, contentTypeForExt } from "@/lib/uploads";

export const runtime = "nodejs";

// GET /api/uploads/:name — public image serving (no auth: email clients fetch
// these directly). Path-traversal-safe.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const clean = safeName(name);
  if (!clean) return new NextResponse("Not found", { status: 404 });

  try {
    const buf = await fs.readFile(path.join(UPLOADS_DIR, clean));
    const ext = clean.split(".").pop() ?? "";
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentTypeForExt(ext),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
