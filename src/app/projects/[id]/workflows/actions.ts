"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireProject } from "@/lib/auth-helpers";
import { workflowDefinitionSchema } from "@/schemas";

export async function createWorkflowAction(
  projectId: string,
  formData: FormData
): Promise<void> {
  await requireProject(projectId);
  const name = String(formData.get("name") ?? "").trim();
  const triggerEvent = String(formData.get("triggerEvent") ?? "").trim();
  if (!name || !triggerEvent) return;

  // Seed with a single trigger node so the builder always has an entry point.
  const workflow = await prisma.workflow.create({
    data: {
      projectId,
      name,
      triggerEvent,
      status: "draft",
      definition: {
        nodes: [
          { id: "trigger", type: "trigger", config: { event: triggerEvent }, next: null },
        ],
      },
    },
  });
  redirect(`/projects/${projectId}/workflows/${workflow.id}`);
}

export interface SaveState {
  error?: string;
  ok?: boolean;
}

export async function saveWorkflowAction(
  projectId: string,
  workflowId: string,
  _prev: SaveState,
  formData: FormData
): Promise<SaveState> {
  await requireProject(projectId);

  const name = String(formData.get("name") ?? "").trim();
  const triggerEvent = String(formData.get("triggerEvent") ?? "").trim();
  if (!name || !triggerEvent) return { error: "Name and trigger event are required." };

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("definition") ?? ""));
  } catch {
    return { error: "Invalid workflow definition." };
  }
  const parsed = workflowDefinitionSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid workflow definition." };
  }

  await prisma.workflow.updateMany({
    where: { id: workflowId, projectId },
    data: { name, triggerEvent, definition: parsed.data },
  });
  revalidatePath(`/projects/${projectId}/workflows/${workflowId}`);
  return { ok: true };
}

export async function setWorkflowStatusAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId"));
  const workflowId = String(formData.get("workflowId"));
  const status = String(formData.get("status"));
  await requireProject(projectId);
  if (status !== "active" && status !== "paused" && status !== "draft") return;

  await prisma.workflow.updateMany({
    where: { id: workflowId, projectId },
    data: { status },
  });
  revalidatePath(`/projects/${projectId}/workflows`);
  revalidatePath(`/projects/${projectId}/workflows/${workflowId}`);
}

export async function deleteWorkflowAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId"));
  const workflowId = String(formData.get("workflowId"));
  await requireProject(projectId);
  await prisma.workflow.deleteMany({ where: { id: workflowId, projectId } });
  revalidatePath(`/projects/${projectId}/workflows`);
  redirect(`/projects/${projectId}/workflows`);
}
