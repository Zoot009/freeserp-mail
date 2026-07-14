import "server-only";
import { redirect, notFound } from "next/navigation";
import { prisma } from "./db";
import { getSession, type SessionPayload } from "./session";

/** For pages: returns the session or redirects to /login. */
export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Loads a project the current user owns, or 404s. */
export async function requireProject(projectId: string) {
  const session = await requireUser();
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.userId },
  });
  if (!project) notFound();
  return { project, session };
}
