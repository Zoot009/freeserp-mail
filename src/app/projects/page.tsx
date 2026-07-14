import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { logoutAction } from "@/app/actions/auth";
import { createProjectAction } from "./actions";
import { Button, Card, Input, PageHeader, EmptyState } from "@/components/ui";

export default async function ProjectsPage() {
  const session = await requireUser();
  const projects = await prisma.project.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { contacts: true, workflows: true } } },
  });

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="font-semibold text-slate-900">✉️ Email Automation</span>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>{session.email}</span>
            <form action={logoutAction}>
              <button className="text-slate-600 hover:text-slate-900">Sign out</button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <PageHeader title="Projects" description="Each project is an isolated workspace with its own API keys, contacts, and workflows." />

        <Card className="mb-8">
          <form action={createProjectAction} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                New project name
              </label>
              <Input name="name" placeholder="e.g. Acme Production" required />
            </div>
            <Button type="submit">Create project</Button>
          </form>
        </Card>

        {projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Create your first project to get an API key and start sending events."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <h3 className="font-medium text-slate-900">{p.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {p._count.contacts} contacts · {p._count.workflows} workflows
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
