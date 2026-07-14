"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { projectSchema } from "@/schemas";

export async function createProjectAction(formData: FormData): Promise<void> {
  const session = await requireUser();
  const parsed = projectSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return;

  const project = await prisma.project.create({
    data: { name: parsed.data.name, userId: session.userId },
  });
  redirect(`/projects/${project.id}`);
}

export async function deleteProjectAction(formData: FormData): Promise<void> {
  const session = await requireUser();
  const projectId = String(formData.get("projectId"));
  await prisma.project.deleteMany({
    where: { id: projectId, userId: session.userId },
  });
  revalidatePath("/projects");
  redirect("/projects");
}
