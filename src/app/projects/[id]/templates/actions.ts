"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireProject } from "@/lib/auth-helpers";
import { templateSchema } from "@/schemas";

export interface TemplateState {
  error?: string;
}

function parse(formData: FormData) {
  return templateSchema.safeParse({
    name: formData.get("name"),
    subject: formData.get("subject"),
    html: formData.get("html"),
    text: formData.get("text") || undefined,
  });
}

export async function createTemplateAction(
  projectId: string,
  _prev: TemplateState,
  formData: FormData
): Promise<TemplateState> {
  await requireProject(projectId);
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid template" };
  }
  await prisma.emailTemplate.create({
    data: { projectId, ...parsed.data },
  });
  revalidatePath(`/projects/${projectId}/templates`);
  redirect(`/projects/${projectId}/templates`);
}

export async function updateTemplateAction(
  projectId: string,
  templateId: string,
  _prev: TemplateState,
  formData: FormData
): Promise<TemplateState> {
  await requireProject(projectId);
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid template" };
  }
  await prisma.emailTemplate.updateMany({
    where: { id: templateId, projectId },
    data: parsed.data,
  });
  revalidatePath(`/projects/${projectId}/templates`);
  redirect(`/projects/${projectId}/templates`);
}

export async function deleteTemplateAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId"));
  const templateId = String(formData.get("templateId"));
  await requireProject(projectId);
  await prisma.emailTemplate.deleteMany({ where: { id: templateId, projectId } });
  revalidatePath(`/projects/${projectId}/templates`);
}
