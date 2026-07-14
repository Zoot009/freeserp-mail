import { requireProject } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui";
import { TemplateEditor } from "../editor";
import { createTemplateAction } from "../actions";

export default async function NewTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireProject(id);
  const action = createTemplateAction.bind(null, id);

  return (
    <div>
      <PageHeader title="New template" />
      <TemplateEditor action={action} submitLabel="Create template" />
    </div>
  );
}
