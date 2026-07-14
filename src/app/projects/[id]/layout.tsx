import Link from "next/link";
import { requireProject } from "@/lib/auth-helpers";
import { logoutAction } from "@/app/actions/auth";
import { ProjectNav } from "./nav";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { project, session } = await requireProject(id);

  return (
    <div className="min-h-screen bg-[#fafafb]">
      <header className="border-b border-[#e6e8eb] bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/projects" className="op-label text-slate-900">
                ✉ EMAIL·AUTO
              </Link>
              <span className="hidden text-slate-300 sm:inline">/</span>
              <span className="hidden text-sm font-semibold text-slate-800 sm:inline">
                {project.name}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="op-label hidden text-slate-400 md:inline">
                {session.email}
              </span>
              <form action={logoutAction}>
                <button className="op-label text-slate-500 hover:text-slate-900">
                  Logout
                </button>
              </form>
            </div>
          </div>
          <div className="h-px bg-[#eef0f3]" />
          <div className="py-3">
            <ProjectNav projectId={project.id} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
