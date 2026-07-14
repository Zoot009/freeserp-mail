import { prisma } from "./db";
import {
  DEFAULT_BRANDING,
  renderBrandedEmail,
  type BrandingView,
} from "./branded-email";

export { DEFAULT_BRANDING, renderBrandedEmail };
export type { BrandingView };

export async function getBranding(projectId: string): Promise<BrandingView> {
  const row = await prisma.branding.findUnique({ where: { projectId } });
  if (!row) return DEFAULT_BRANDING;
  const { id: _id, projectId: _p, updatedAt: _u, ...rest } = row;
  return rest;
}
