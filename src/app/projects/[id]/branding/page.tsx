import { requireProject } from "@/lib/auth-helpers";
import { getBranding } from "@/lib/branding";
import { PageHeader } from "@/components/ui";
import { BrandingForm } from "./branding-form";

export default async function BrandingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireProject(id);
  const branding = await getBranding(id);

  return (
    <div>
      <PageHeader
        eyebrow="Design"
        title="Branding"
        description="Applied to every email automatically. Change once — all templates update."
      />
      <BrandingForm projectId={id} initial={branding} />
    </div>
  );
}
