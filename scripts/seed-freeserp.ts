/**
 * Seeds the FreeSERP onboarding & activation flows (7 templates + 7 workflows)
 * into an existing project. Idempotent: skips anything already present by name.
 *
 * Run locally against the Dockerized DB (port 5432 is exposed in dev):
 *   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/email_automation \
 *     npx tsx scripts/seed-freeserp.ts
 *
 * Optionally target a specific project: PROJECT_ID=xxx (defaults to newest project).
 *
 * NOTE: Wait steps are set SHORT (minutes) so you can test today. For production,
 * bump them to the commented values (days).
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { buildEmail } from "./email-design";

const prisma = new PrismaClient();

const CTA = "https://freeserp.com/dashboard";

// Full-HTML templates in the FreeSerp thank-you style (blue hero + waves + pill
// CTA + blue footer). Being full <html> docs, they bypass the branding wrapper.
const templates: Record<string, { name: string; subject: string; html: string }> = {
  welcome: {
    name: "FreeSERP — Welcome",
    subject: "Welcome to FreeSerp, {{ firstName }}! 🎉",
    html: buildEmail({
      topRight: "We're so happy to have you! 💛",
      heading: "Welcome",
      subtitle: "for signing up, {{ firstName }}!",
      illustration: "thankyou-illustration.png",
      body: [
        "We truly appreciate you joining and becoming part of the FreeSerp community.",
        "Get ready to find and fix exactly what's holding your website back.",
      ],
      features: [
        { icon: "ic-mail.png", title: "Stay Updated", text: "Be the first to know about new features and SEO tips." },
        { icon: "ic-star.png", title: "Powerful Tools", text: "Audits, backlinks, keywords & Search Console in one place." },
        { icon: "ic-heart.png", title: "You Matter", text: "We're here to support you every step of the way." },
      ],
      ctaText: "Open dashboard",
      ctaUrl: CTA,
      footerHeading: "Thanks again!",
      footerText: "We're excited to have you with us.<br/>— The <strong style=\"color:#fff;\">FreeSerp</strong> team",
    }),
  },
  abandoned: {
    name: "FreeSERP — Abandoned signup",
    subject: "Finish setting up your FreeSerp account",
    html: buildEmail({
      topRight: "You're almost there",
      heading: "Almost&nbsp;There",
      subtitle: "finish your signup",
      illustration: "comeback-illustration.png",
      body: [
        "Hi {{ firstName }}, you started creating your FreeSerp account but didn't finish.",
        "It only takes a minute — pick up right where you left off.",
      ],
      ctaText: "Complete signup",
      ctaUrl: "https://freeserp.com/signup",
      footerHeading: "See you soon!",
      footerText: "Your rankings are waiting.<br/>— The <strong style=\"color:#fff;\">FreeSerp</strong> team",
    }),
  },
  neverActivated: {
    name: "FreeSERP — Never activated",
    subject: "{{ firstName }}, run your first search on FreeSerp",
    html: buildEmail({
      topRight: "Let's get started",
      heading: "Ready?",
      subtitle: "run your first search",
      illustration: "comeback-illustration.png",
      body: [
        "Your account is set up, {{ firstName }}, but you haven't run a search yet.",
        "Enter any keyword to see your Google position in seconds.",
      ],
      ctaText: "Run your first search",
      ctaUrl: CTA,
      footerHeading: "We're here to help!",
      footerText: "It only takes one search to get going.<br/>— The <strong style=\"color:#fff;\">FreeSerp</strong> team",
    }),
  },
  firstActionNudge: {
    name: "FreeSERP — Track your first keyword",
    subject: "Track your first keyword in FreeSerp",
    html: buildEmail({
      topRight: "Tip for you",
      heading: "Track&nbsp;It",
      subtitle: "add your first keyword",
      illustration: "thankyou-illustration.png",
      body: [
        "Nice progress, {{ firstName }}! Add a keyword to track and we'll monitor your ranking every day.",
        "Watch your position change over time — automatically.",
      ],
      ctaText: "Track a keyword",
      ctaUrl: CTA,
      footerHeading: "Keep it up!",
      footerText: "Small steps, big rankings.<br/>— The <strong style=\"color:#fff;\">FreeSerp</strong> team",
    }),
  },
  setupChecklist: {
    name: "FreeSERP — Complete your setup",
    subject: "Complete your FreeSerp setup",
    html: buildEmail({
      topRight: "A few steps left",
      heading: "Finish&nbsp;Setup",
      subtitle: "you're nearly there",
      illustration: "comeback-illustration.png",
      body: [
        "Hi {{ firstName }}, finish your setup to get the most out of FreeSerp.",
        "Add a website, track keywords, and connect Search Console.",
      ],
      ctaText: "Finish setup",
      ctaUrl: CTA,
      footerHeading: "Almost done!",
      footerText: "A complete setup means better insights.<br/>— The <strong style=\"color:#fff;\">FreeSerp</strong> team",
    }),
  },
  firstWin: {
    name: "FreeSERP — First win 🎉",
    subject: "Nice! You ran your first search 🎉",
    html: buildEmail({
      topRight: "Great job! 🎉",
      heading: "First&nbsp;Win!",
      subtitle: "you ran your first search",
      illustration: "thankyou-illustration.png",
      body: [
        "You're off to a great start, {{ firstName }}!",
        "Track that keyword to watch it over time, or add your website for full reporting.",
      ],
      ctaText: "Keep going",
      ctaUrl: CTA,
      footerHeading: "Onwards!",
      footerText: "This is just the beginning.<br/>— The <strong style=\"color:#fff;\">FreeSerp</strong> team",
    }),
  },
  connectGsc: {
    name: "FreeSERP — Connect Search Console",
    subject: "Connect Google Search Console to unlock full data",
    html: buildEmail({
      topRight: "Unlock more data",
      heading: "Unlock&nbsp;Data",
      subtitle: "connect Search Console",
      illustration: "thankyou-illustration.png",
      body: [
        "You added a website — nice work, {{ firstName }}!",
        "Connect Google Search Console to see impressions, clicks, and every keyword you rank for.",
      ],
      ctaText: "Connect Search Console",
      ctaUrl: CTA,
      footerHeading: "See the full picture!",
      footerText: "Real search data, all in one place.<br/>— The <strong style=\"color:#fff;\">FreeSerp</strong> team",
    }),
  },
};

type Node = Record<string, unknown>;

// Helpers to build linear definitions the engine understands.
const trigger = (event: string, next: string | null): Node => ({ id: "trigger", type: "trigger", config: { event }, next });
const wait = (id: string, duration: number, unit: string, next: string | null): Node => ({ id, type: "wait", config: { duration, unit }, next });
const condition = (id: string, field: string, op: string, value: string, onTrue: string | null, onFalse: string | null): Node => ({ id, type: "condition", config: { field, op, value }, onTrue, onFalse });
const sendEmail = (id: string, templateId: string, next: string | null): Node => ({ id, type: "send_email", config: { templateId }, next });

async function main() {
  const project = process.env.PROJECT_ID
    ? await prisma.project.findUnique({ where: { id: process.env.PROJECT_ID } })
    : await prisma.project.findFirst({ orderBy: { createdAt: "desc" } });

  if (!project) throw new Error("No project found. Create a project in the dashboard first.");
  console.log(`Seeding project: ${project.name} (${project.id})`);

  // Default branding applied to every email.
  const branding = {
    brandName: "FreeSERP",
    brandColor: "#3552e6",
    senderName: "FreeSERP Team",
    footerText: "FreeSERP — the free Google rank tracker.",
    unsubscribeText: "You're receiving this because you signed up for FreeSERP.",
    logoUrl: "",
    address: "",
    socialInstagram: "",
    socialX: "",
    socialLinkedin: "",
  };
  await prisma.branding.upsert({
    where: { projectId: project.id },
    create: { projectId: project.id, ...branding },
    update: branding,
  });
  console.log("  branding set");

  // 1) Upsert templates, collect their ids.
  const ids: Record<string, string> = {};
  for (const [key, t] of Object.entries(templates)) {
    const existing = await prisma.emailTemplate.findFirst({ where: { projectId: project.id, name: t.name } });
    const row = existing
      ? await prisma.emailTemplate.update({ where: { id: existing.id }, data: t })
      : await prisma.emailTemplate.create({ data: { projectId: project.id, ...t } });
    ids[key] = row.id;
    console.log(`  template ${existing ? "updated" : "created"}: ${t.name}`);
  }

  // 2) Define the 7 workflows. Wait durations are SHORT for testing.
  const workflows: Array<{ name: string; triggerEvent: string; nodes: Node[] }> = [
    {
      name: "Welcome",
      triggerEvent: "signup",
      nodes: [trigger("signup", "n1"), sendEmail("n1", ids.welcome, null)],
    },
    {
      name: "Abandoned signup",
      triggerEvent: "registration_started",
      nodes: [
        trigger("registration_started", "n1"),
        wait("n1", 2, "minutes", "n2"), // prod: 1 hour
        condition("n2", "signup_completed", "eq", "false", "n3", null),
        sendEmail("n3", ids.abandoned, null),
      ],
    },
    {
      name: "Never activated",
      triggerEvent: "signup",
      nodes: [
        trigger("signup", "n1"),
        wait("n1", 2, "minutes", "n2"), // prod: 1 day
        condition("n2", "activated", "eq", "false", "n3", null),
        sendEmail("n3", ids.neverActivated, null),
      ],
    },
    {
      name: "First-action nudge",
      triggerEvent: "signup",
      nodes: [
        trigger("signup", "n1"),
        wait("n1", 3, "minutes", "n2"), // prod: 2 days
        condition("n2", "keywords_count", "eq", "0", "n3", null),
        sendEmail("n3", ids.firstActionNudge, null),
      ],
    },
    {
      name: "Setup checklist",
      triggerEvent: "signup",
      // "Setup incomplete" proxy: still no website added a few days after signup.
      nodes: [
        trigger("signup", "n1"),
        wait("n1", 4, "minutes", "n2"), // prod: 3 days
        condition("n2", "website_added", "eq", "false", "n3", null),
        sendEmail("n3", ids.setupChecklist, null),
      ],
    },
    {
      name: "First win celebration",
      triggerEvent: "first_search",
      nodes: [trigger("first_search", "n1"), sendEmail("n1", ids.firstWin, null)],
    },
    {
      name: "Connect Search Console",
      triggerEvent: "website_added",
      nodes: [
        trigger("website_added", "n1"),
        wait("n1", 2, "minutes", "n2"), // prod: 1 hour
        condition("n2", "gsc_connected", "eq", "false", "n3", null),
        sendEmail("n3", ids.connectGsc, null),
      ],
    },
  ];

  // 3) Upsert workflows, set them ACTIVE.
  for (const wf of workflows) {
    const existing = await prisma.workflow.findFirst({ where: { projectId: project.id, name: wf.name } });
    const data = {
      name: wf.name,
      triggerEvent: wf.triggerEvent,
      status: "active" as const,
      definition: { nodes: wf.nodes } as unknown as Prisma.InputJsonValue,
    };
    if (existing) {
      await prisma.workflow.update({ where: { id: existing.id }, data });
      console.log(`  workflow updated + activated: ${wf.name}`);
    } else {
      await prisma.workflow.create({ data: { projectId: project.id, ...data } });
      console.log(`  workflow created + activated: ${wf.name}`);
    }
  }

  console.log("\n✅ Seed complete — 7 templates and 7 active workflows.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
