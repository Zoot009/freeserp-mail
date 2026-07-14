/**
 * Renders the stored templates into a single gallery HTML file for local
 * preview (images load from the running platform at localhost:3000).
 *   DATABASE_URL=... OUT=<path> npx tsx scripts/preview-emails.ts
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";

const prisma = new PrismaClient();
const ASSET = process.env.PREVIEW_ASSET_BASE ?? "http://localhost:3000";
const OUT = process.env.OUT ?? "preview.html";

function fill(html: string): string {
  return html
    .replace(/\{\{\s*assetBase\s*\}\}/g, ASSET)
    .replace(/\{\{\s*firstName\s*\}\}/g, "Jagdish")
    .replace(/\{\{\s*unsubscribeUrl\s*\}\}/g, "#")
    .replace(/\{\{\s*email\s*\}\}/g, "you@example.com");
}

async function main() {
  const project = await prisma.project.findFirst({ orderBy: { createdAt: "desc" } });
  const templates = await prisma.emailTemplate.findMany({
    where: { projectId: project!.id },
    orderBy: { name: "asc" },
  });

  const cards = templates
    .map((t) => {
      const srcdoc = fill(t.html).replace(/"/g, "&quot;");
      return `<section>
        <h2>${t.name}</h2>
        <p class="subj">Subject: ${fill(t.subject)}</p>
        <iframe srcdoc="${srcdoc}"></iframe>
      </section>`;
    })
    .join("\n");

  const page = `<!doctype html><html><head><meta charset="utf-8"><title>Email preview</title>
  <style>
    body{margin:0;background:#f1f5f9;font-family:system-ui,sans-serif;padding:24px}
    h1{font-size:20px}
    section{max-width:640px;margin:0 auto 40px auto}
    h2{font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#475569;margin:24px 0 4px}
    .subj{font-size:12px;color:#64748b;margin:0 0 8px}
    iframe{width:100%;height:900px;border:1px solid #e2e8f0;border-radius:12px;background:#fff}
  </style></head><body>
  <h1 style="text-align:center">FreeSerp onboarding emails — preview</h1>
  ${cards}
  </body></html>`;

  writeFileSync(OUT, page);
  console.log(`Wrote ${OUT} (${templates.length} templates)`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
