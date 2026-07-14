import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireProject } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui";
import { TemplateEditor } from "../editor";
import { updateTemplateAction } from "../actions";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string; templateId: string }>;
}) {
  const { id, templateId } = await params;
  await requireProject(id);

  const template = await prisma.emailTemplate.findFirst({
    where: { id: templateId, projectId: id },
  });
  if (!template) notFound();

  const action = updateTemplateAction.bind(null, id, templateId);

  return (
    <div>
      <PageHeader title="Edit template" />
      <TemplateEditor
        action={action}
        submitLabel="Save changes"
        initial={{
          name: template.name,
          subject: template.subject,
          html: template.html,
          text: template.text ?? "",
        }}
      />
    </div>
  );
}
