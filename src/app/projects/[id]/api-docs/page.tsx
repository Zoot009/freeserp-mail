import { requireProject } from "@/lib/auth-helpers";
import { env } from "@/lib/env";
import { PageHeader, Card, Badge } from "@/components/ui";

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-md bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
      <code>{children}</code>
    </pre>
  );
}

function Endpoint({
  method,
  path,
  children,
}: {
  method: string;
  path: string;
  children: React.ReactNode;
}) {
  const color =
    method === "GET" ? "green" : method === "POST" ? "indigo" : "amber";
  return (
    <Card className="mb-4">
      <div className="flex items-center gap-2">
        <Badge color={color as "green" | "indigo" | "amber"}>{method}</Badge>
        <code className="text-sm text-slate-800">{path}</code>
      </div>
      <div className="mt-3 text-sm text-slate-600">{children}</div>
    </Card>
  );
}

export default async function ApiDocsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireProject(id);
  const base = env.appUrl;

  return (
    <div>
      <PageHeader
        title="API reference"
        description="Send events and manage contacts from any website or backend."
      />

      <Card className="mb-6">
        <h2 className="font-medium text-slate-900">Authentication</h2>
        <p className="mt-1 text-sm text-slate-600">
          Every request needs an API key (create one under{" "}
          <a href={`/projects/${id}/settings`} className="text-indigo-600 hover:underline">
            Settings
          </a>
          ) sent as a Bearer token:
        </p>
        <Code>{`Authorization: Bearer ek_live_your_key_here`}</Code>
        <p className="mt-2 text-sm text-slate-500">
          Base URL: <code className="text-xs">{base}</code>
        </p>
      </Card>

      <Endpoint method="POST" path="/api/v1/events">
        <p>
          Track a custom event. Creates or updates the contact, records the event,
          and starts any active workflow whose trigger matches <code>event</code>.
        </p>
        <Code>{`curl -X POST ${base}/api/v1/events \\
  -H "Authorization: Bearer ek_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "jane@example.com",
    "event": "signup",
    "properties": { "source": "landing-page" },
    "contactProperties": { "firstName": "Jane", "plan": "free" }
  }'`}</Code>
        <p className="mt-2">
          Returns <code>202</code> with{" "}
          <code>{`{ eventId, contactId, workflowsTriggered }`}</code>.
        </p>
      </Endpoint>

      <Endpoint method="POST" path="/api/v1/contacts">
        <p>Create or update a contact without firing an event.</p>
        <Code>{`curl -X POST ${base}/api/v1/contacts \\
  -H "Authorization: Bearer ek_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "jane@example.com",
    "properties": { "firstName": "Jane" },
    "subscribed": true
  }'`}</Code>
      </Endpoint>

      <Endpoint method="GET" path="/api/v1/contacts/:email">
        <p>Fetch a single contact by email.</p>
        <Code>{`curl ${base}/api/v1/contacts/jane@example.com \\
  -H "Authorization: Bearer ek_live_your_key_here"`}</Code>
      </Endpoint>

      <Endpoint method="PATCH" path="/api/v1/contacts/:email">
        <p>
          Update a contact&apos;s properties or subscription status (e.g. to
          unsubscribe).
        </p>
        <Code>{`curl -X PATCH ${base}/api/v1/contacts/jane@example.com \\
  -H "Authorization: Bearer ek_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{ "subscribed": false }'`}</Code>
      </Endpoint>

      <Card>
        <h2 className="font-medium text-slate-900">Template variables</h2>
        <p className="mt-1 text-sm text-slate-600">
          In email templates you can reference contact properties, event
          properties, plus <code>{"{{ email }}"}</code> and{" "}
          <code>{"{{ unsubscribeUrl }}"}</code> using Handlebars syntax.
        </p>
      </Card>
    </div>
  );
}
