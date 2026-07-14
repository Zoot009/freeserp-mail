import { prisma } from "@/lib/db";
import { Prisma, type Contact } from "@prisma/client";

/**
 * Upsert a contact by (project, email), shallow-merging new properties into any
 * existing ones. Shared by the events and contacts API endpoints.
 */
export async function upsertContact(args: {
  projectId: string;
  email: string;
  properties?: Record<string, unknown>;
  subscribed?: boolean;
}): Promise<Contact> {
  const email = args.email.toLowerCase();
  const existing = await prisma.contact.findUnique({
    where: { projectId_email: { projectId: args.projectId, email } },
  });

  const mergedProps = {
    ...((existing?.properties as Record<string, unknown>) ?? {}),
    ...(args.properties ?? {}),
  } as Prisma.InputJsonValue;

  if (existing) {
    return prisma.contact.update({
      where: { id: existing.id },
      data: {
        properties: mergedProps,
        ...(args.subscribed !== undefined ? { subscribed: args.subscribed } : {}),
      },
    });
  }

  return prisma.contact.create({
    data: {
      projectId: args.projectId,
      email,
      properties: mergedProps,
      ...(args.subscribed !== undefined ? { subscribed: args.subscribed } : {}),
    },
  });
}
