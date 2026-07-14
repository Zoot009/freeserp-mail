import type { NextRequest } from "next/server";
import { authenticateApiKey, json, apiError } from "@/lib/api-auth";
import { eventIngestSchema } from "@/schemas";
import { prisma } from "@/lib/db";
import { upsertContact } from "@/server/contacts";
import { startWorkflowsForEvent } from "@/lib/engine/start";

export const runtime = "nodejs";

// POST /api/v1/events
// Ingest a custom event: upsert the contact, store the event, and start any
// active workflow triggered by this event name.
export async function POST(req: NextRequest) {
  const project = await authenticateApiKey(req);
  if (!project) return apiError("Unauthorized", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = eventIngestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.errors[0]?.message ?? "Invalid payload", 422);
  }
  const { email, event, properties, contactProperties } = parsed.data;

  const contact = await upsertContact({
    projectId: project.id,
    email,
    properties: contactProperties,
  });

  const stored = await prisma.event.create({
    data: {
      projectId: project.id,
      contactId: contact.id,
      name: event,
      properties: (properties ?? {}) as object,
    },
  });

  const triggered = await startWorkflowsForEvent({
    projectId: project.id,
    contactId: contact.id,
    event,
    eventProperties: properties ?? {},
    contactProperties: (contact.properties as Record<string, unknown>) ?? {},
  });

  return json(
    {
      ok: true,
      eventId: stored.id,
      contactId: contact.id,
      workflowsTriggered: triggered,
    },
    202
  );
}
