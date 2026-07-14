import type { NextRequest } from "next/server";
import { authenticateApiKey, json, apiError } from "@/lib/api-auth";
import { contactPatchSchema } from "@/schemas";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";

async function findContact(projectId: string, emailRaw: string) {
  const email = decodeURIComponent(emailRaw).toLowerCase();
  return prisma.contact.findUnique({
    where: { projectId_email: { projectId, email } },
  });
}

// GET /api/v1/contacts/:email
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const project = await authenticateApiKey(req);
  if (!project) return apiError("Unauthorized", 401);

  const { email } = await params;
  const contact = await findContact(project.id, email);
  if (!contact) return apiError("Contact not found", 404);

  return json({
    id: contact.id,
    email: contact.email,
    properties: contact.properties,
    subscribed: contact.subscribed,
    createdAt: contact.createdAt,
  });
}

// PATCH /api/v1/contacts/:email — update properties / subscription.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const project = await authenticateApiKey(req);
  if (!project) return apiError("Unauthorized", 401);

  const { email } = await params;
  const contact = await findContact(project.id, email);
  if (!contact) return apiError("Contact not found", 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }
  const parsed = contactPatchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.errors[0]?.message ?? "Invalid payload", 422);
  }

  const mergedProps = {
    ...((contact.properties as Record<string, unknown>) ?? {}),
    ...(parsed.data.properties ?? {}),
  } as Prisma.InputJsonValue;

  const updated = await prisma.contact.update({
    where: { id: contact.id },
    data: {
      properties: mergedProps,
      ...(parsed.data.subscribed !== undefined
        ? { subscribed: parsed.data.subscribed }
        : {}),
    },
  });

  return json({
    id: updated.id,
    email: updated.email,
    properties: updated.properties,
    subscribed: updated.subscribed,
  });
}
