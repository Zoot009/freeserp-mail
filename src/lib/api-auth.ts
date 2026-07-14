import { NextResponse, type NextRequest } from "next/server";
import type { Project } from "@prisma/client";
import { prisma } from "./db";
import { hashApiKey } from "./apikey";

// Resolve the project for an incoming API request from its Bearer key.
export async function authenticateApiKey(
  req: NextRequest
): Promise<Project | null> {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const key = await prisma.apiKey.findUnique({
    where: { keyHash: hashApiKey(match[1].trim()) },
    include: { project: true },
  });
  if (!key || key.revokedAt) return null;

  // Best-effort last-used timestamp; don't block the request on it.
  void prisma.apiKey
    .update({ where: { id: key.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return key.project;
}

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}
