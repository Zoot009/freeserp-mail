import type { ActionHandler } from "../types";
import type { ConditionNode } from "@/schemas";

// Resolve a dotted field against the contact properties first, then the event
// context (event + contact properties captured at trigger time).
function resolveField(
  field: string,
  contactProps: Record<string, unknown>,
  eventContext: Record<string, unknown>
): unknown {
  if (field in contactProps) return contactProps[field];
  if (field in eventContext) return eventContext[field];
  // support dotted path in eventContext
  return field.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as object)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, eventContext);
}

function evaluate(actual: unknown, op: ConditionNode["config"]["op"], expected: string): boolean {
  switch (op) {
    case "exists":
      return actual !== undefined && actual !== null && actual !== "";
    case "not_exists":
      return actual === undefined || actual === null || actual === "";
    case "eq":
      return String(actual) === expected;
    case "neq":
      return String(actual) !== expected;
    case "gt":
      return Number(actual) > Number(expected);
    case "lt":
      return Number(actual) < Number(expected);
    default:
      return false;
  }
}

// Condition branches the run: onTrue or onFalse (either may be null → end).
export const conditionHandler: ActionHandler = {
  type: "condition",
  async execute(ctx) {
    const node = ctx.node as ConditionNode;
    const contactProps = (ctx.contact.properties as Record<string, unknown>) ?? {};
    const actual = resolveField(node.config.field, contactProps, ctx.eventContext);
    const passed = evaluate(actual, node.config.op, node.config.value ?? "");
    return {
      nextNodeId: passed ? node.onTrue : node.onFalse,
      detail: { field: node.config.field, op: node.config.op, passed },
    };
  },
};
