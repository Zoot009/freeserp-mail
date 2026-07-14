import type { NextRequest } from "next/server";
import { authenticateApiKey, json, apiError } from "@/lib/api-auth";
import { contactUpsertSchema } from "@/schemas";
import { upsertContact } from "@/server/contacts";

export const runtime = "nodejs";

// POST /api/v1/contacts — create or update a contact (no event, no workflow trigger).
export async function POST(req: NextRequest) {
  const project = await authenticateApiKey(req);
  if (!project) return apiError("Unauthorized", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = contactUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.errors[0]?.message ?? "Invalid payload", 422);
  }

  const contact = await upsertContact({
    projectId: project.id,
    email: parsed.data.email,
    properties: parsed.data.properties,
    subscribed: parsed.data.subscribed,
  });

  return json({
    id: contact.id,
    email: contact.email,
    properties: contact.properties,
    subscribed: contact.subscribed,
  });
}
