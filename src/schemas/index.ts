import { z } from "zod";

// ---- Auth ----
export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// ---- Project ----
export const projectSchema = z.object({
  name: z.string().min(1).max(100),
});

// ---- API key ----
export const apiKeySchema = z.object({
  name: z.string().min(1).max(100),
});

// ---- SMTP ----
export const smtpSchema = z.object({
  host: z.string().min(1),
  port: z.coerce.number().int().min(1).max(65535),
  secure: z.coerce.boolean().default(false),
  username: z.string().default(""),
  password: z.string().optional(), // blank = keep existing
  fromEmail: z.string().email(),
  fromName: z.string().default(""),
});

// ---- Branding ----
export const brandingSchema = z.object({
  brandName: z.string().max(120).default(""),
  logoUrl: z.string().max(1000).default(""),
  brandColor: z.string().regex(/^#?[0-9a-fA-F]{6}$/, "Use a hex color like #4f46e5").default("#4f46e5"),
  senderName: z.string().max(120).default(""),
  footerText: z.string().max(1000).default(""),
  address: z.string().max(300).default(""),
  unsubscribeText: z.string().max(300).default("You're receiving this because you signed up."),
  socialInstagram: z.string().max(500).default(""),
  socialX: z.string().max(500).default(""),
  socialLinkedin: z.string().max(500).default(""),
});

// ---- Template ----
export const templateSchema = z.object({
  name: z.string().min(1).max(200),
  subject: z.string().min(1).max(500),
  html: z.string().min(1),
  text: z.string().optional(),
});

// ---- Public API: event ingestion ----
export const eventIngestSchema = z.object({
  email: z.string().email(),
  event: z.string().min(1).max(200),
  properties: z.record(z.unknown()).optional(),
  contactProperties: z.record(z.unknown()).optional(),
});

// ---- Public API: contact upsert ----
export const contactUpsertSchema = z.object({
  email: z.string().email(),
  properties: z.record(z.unknown()).optional(),
  subscribed: z.boolean().optional(),
});

export const contactPatchSchema = z.object({
  properties: z.record(z.unknown()).optional(),
  subscribed: z.boolean().optional(),
});

// ---- Workflow definition (node graph) ----
export const CONDITION_OPS = ["eq", "neq", "exists", "not_exists", "gt", "lt"] as const;
export const WAIT_UNITS = ["minutes", "hours", "days"] as const;

const baseNode = z.object({
  id: z.string().min(1),
});

export const triggerNodeSchema = baseNode.extend({
  type: z.literal("trigger"),
  config: z.object({ event: z.string().min(1) }),
  next: z.string().nullable().default(null),
});

export const waitNodeSchema = baseNode.extend({
  type: z.literal("wait"),
  config: z.object({
    duration: z.coerce.number().int().min(1),
    unit: z.enum(WAIT_UNITS),
  }),
  next: z.string().nullable().default(null),
});

export const conditionNodeSchema = baseNode.extend({
  type: z.literal("condition"),
  config: z.object({
    field: z.string().min(1),
    op: z.enum(CONDITION_OPS),
    value: z.string().optional().default(""),
  }),
  onTrue: z.string().nullable().default(null),
  onFalse: z.string().nullable().default(null),
});

export const sendEmailNodeSchema = baseNode.extend({
  type: z.literal("send_email"),
  config: z.object({ templateId: z.string().min(1) }),
  next: z.string().nullable().default(null),
});

export const workflowNodeSchema = z.discriminatedUnion("type", [
  triggerNodeSchema,
  waitNodeSchema,
  conditionNodeSchema,
  sendEmailNodeSchema,
]);

export const workflowDefinitionSchema = z.object({
  nodes: z.array(workflowNodeSchema),
});

export const workflowSchema = z.object({
  name: z.string().min(1).max(200),
  triggerEvent: z.string().min(1).max(200),
  definition: workflowDefinitionSchema,
});

// ---- Inferred types ----
export type WorkflowNode = z.infer<typeof workflowNodeSchema>;
export type WorkflowDefinition = z.infer<typeof workflowDefinitionSchema>;
export type TriggerNode = z.infer<typeof triggerNodeSchema>;
export type WaitNode = z.infer<typeof waitNodeSchema>;
export type ConditionNode = z.infer<typeof conditionNodeSchema>;
export type SendEmailNode = z.infer<typeof sendEmailNodeSchema>;
