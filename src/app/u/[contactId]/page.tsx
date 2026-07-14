import { prisma } from "@/lib/db";

// Public one-click unsubscribe landing. Linked from every email via
// {{ unsubscribeUrl }}. No auth — the contact id is the capability token.
export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ contactId: string }>;
}) {
  const { contactId } = await params;
  const contact = await prisma.contact.findUnique({ where: { id: contactId } });

  if (contact && contact.subscribed) {
    await prisma.contact.update({
      where: { id: contactId },
      data: { subscribed: false },
    });
  }

  return (
    <div className="mx-auto mt-32 max-w-md text-center">
      <h1 className="text-xl font-semibold text-slate-900">
        {contact ? "You've been unsubscribed" : "Link not found"}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        {contact
          ? `${contact.email} will no longer receive automated emails.`
          : "This unsubscribe link is invalid or has expired."}
      </p>
    </div>
  );
}
