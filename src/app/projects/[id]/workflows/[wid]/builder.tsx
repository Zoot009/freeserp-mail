"use client";

import { useActionState, useState } from "react";
import { Button, Input, Label, Select, Card } from "@/components/ui";
import { CONDITION_OPS, WAIT_UNITS, type WorkflowDefinition } from "@/schemas";
import { saveWorkflowAction, type SaveState } from "../actions";

interface TemplateOption {
  id: string;
  name: string;
}

// Local editable step model. The trigger node is implicit (driven by the
// triggerEvent field) and rendered separately.
type Step =
  | { key: string; type: "wait"; duration: number; unit: (typeof WAIT_UNITS)[number] }
  | { key: string; type: "condition"; field: string; op: (typeof CONDITION_OPS)[number]; value: string }
  | { key: string; type: "send_email"; templateId: string };

let counter = 0;
const nextKey = () => `s${counter++}_${Math.round(performance.now())}`;

// ---- (de)serialization between the linear step list and the node graph ----

function toDefinition(triggerEvent: string, steps: Step[]): WorkflowDefinition {
  const ids = steps.map((_, i) => `n${i + 1}`);
  const nextOf = (i: number): string | null => ids[i + 1] ?? null;

  const nodes: WorkflowDefinition["nodes"] = [
    { id: "trigger", type: "trigger", config: { event: triggerEvent }, next: ids[0] ?? null },
  ];

  steps.forEach((step, i) => {
    const id = ids[i];
    const after = nextOf(i);
    if (step.type === "wait") {
      nodes.push({ id, type: "wait", config: { duration: step.duration, unit: step.unit }, next: after });
    } else if (step.type === "condition") {
      // If the condition fails, the run stops (onFalse = null).
      nodes.push({ id, type: "condition", config: { field: step.field, op: step.op, value: step.value }, onTrue: after, onFalse: null });
    } else {
      nodes.push({ id, type: "send_email", config: { templateId: step.templateId }, next: after });
    }
  });

  return { nodes };
}

function fromDefinition(def: WorkflowDefinition | null): Step[] {
  if (!def) return [];
  return def.nodes
    .filter((n) => n.type !== "trigger")
    .map((n): Step => {
      if (n.type === "wait") {
        return { key: nextKey(), type: "wait", duration: n.config.duration, unit: n.config.unit };
      }
      if (n.type === "condition") {
        return { key: nextKey(), type: "condition", field: n.config.field, op: n.config.op, value: n.config.value ?? "" };
      }
      return { key: nextKey(), type: "send_email", templateId: n.config.templateId };
    });
}

export function WorkflowBuilder({
  projectId,
  workflowId,
  initialName,
  initialTrigger,
  initialDefinition,
  templates,
}: {
  projectId: string;
  workflowId: string;
  initialName: string;
  initialTrigger: string;
  initialDefinition: WorkflowDefinition | null;
  templates: TemplateOption[];
}) {
  const [name, setName] = useState(initialName);
  const [triggerEvent, setTriggerEvent] = useState(initialTrigger);
  const [steps, setSteps] = useState<Step[]>(() => fromDefinition(initialDefinition));

  const [state, formAction, pending] = useActionState<SaveState, FormData>(
    saveWorkflowAction.bind(null, projectId, workflowId),
    {}
  );

  function addStep(type: Step["type"]) {
    const base = { key: nextKey() };
    const step: Step =
      type === "wait"
        ? { ...base, type, duration: 1, unit: "days" }
        : type === "condition"
        ? { ...base, type, field: "", op: "eq", value: "" }
        : { ...base, type, templateId: templates[0]?.id ?? "" };
    setSteps((s) => [...s, step]);
  }

  function update(key: string, patch: Partial<Step>) {
    setSteps((s) => s.map((st) => (st.key === key ? ({ ...st, ...patch } as Step) : st)));
  }

  function remove(key: string) {
    setSteps((s) => s.filter((st) => st.key !== key));
  }

  function move(key: string, dir: -1 | 1) {
    setSteps((s) => {
      const i = s.findIndex((st) => st.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= s.length) return s;
      const copy = [...s];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  const definitionJson = JSON.stringify(toDefinition(triggerEvent, steps));

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="definition" value={definitionJson} />

      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Workflow name</Label>
            <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="triggerEvent">Trigger event</Label>
            <Input id="triggerEvent" name="triggerEvent" value={triggerEvent} onChange={(e) => setTriggerEvent(e.target.value)} required />
          </div>
        </div>
      </Card>

      {/* Trigger node (implicit) */}
      <StepShell badge="1" title="Trigger" subtitle={`When "${triggerEvent || "…"}" is received`} tone="indigo" />

      {steps.map((step, i) => (
        <StepShell
          key={step.key}
          badge={String(i + 2)}
          title={STEP_TITLES[step.type]}
          onRemove={() => remove(step.key)}
          onUp={i > 0 ? () => move(step.key, -1) : undefined}
          onDown={i < steps.length - 1 ? () => move(step.key, 1) : undefined}
        >
          {step.type === "wait" && (
            <div className="flex items-end gap-3">
              <div className="w-24">
                <Label>Duration</Label>
                <Input
                  type="number"
                  min={1}
                  value={step.duration}
                  onChange={(e) => update(step.key, { duration: Number(e.target.value) })}
                />
              </div>
              <div className="w-40">
                <Label>Unit</Label>
                <Select value={step.unit} onChange={(e) => update(step.key, { unit: e.target.value as (typeof WAIT_UNITS)[number] })}>
                  {WAIT_UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </Select>
              </div>
            </div>
          )}

          {step.type === "condition" && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Field</Label>
                <Input
                  placeholder="plan"
                  value={step.field}
                  onChange={(e) => update(step.key, { field: e.target.value })}
                />
              </div>
              <div>
                <Label>Operator</Label>
                <Select value={step.op} onChange={(e) => update(step.key, { op: e.target.value as never })}>
                  {CONDITION_OPS.map((op) => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Value</Label>
                <Input
                  placeholder="free"
                  value={step.value}
                  onChange={(e) => update(step.key, { value: e.target.value })}
                />
              </div>
              <p className="col-span-3 text-xs text-slate-400">
                If the condition is false, the run stops here.
              </p>
            </div>
          )}

          {step.type === "send_email" && (
            <div>
              <Label>Template</Label>
              {templates.length === 0 ? (
                <p className="text-sm text-amber-600">
                  No templates yet — create one first.
                </p>
              ) : (
                <Select value={step.templateId} onChange={(e) => update(step.key, { templateId: e.target.value })}>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Select>
              )}
            </div>
          )}
        </StepShell>
      ))}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => addStep("wait")}>+ Wait</Button>
        <Button type="button" variant="secondary" onClick={() => addStep("condition")}>+ Condition</Button>
        <Button type="button" variant="secondary" onClick={() => addStep("send_email")}>+ Send Email</Button>
      </div>

      <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save workflow"}
        </Button>
        {state.ok && <span className="text-sm text-green-600">Saved.</span>}
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}

const STEP_TITLES: Record<Step["type"], string> = {
  wait: "Wait",
  condition: "Condition",
  send_email: "Send Email",
};

function StepShell({
  badge,
  title,
  subtitle,
  tone = "slate",
  children,
  onRemove,
  onUp,
  onDown,
}: {
  badge: string;
  title: string;
  subtitle?: string;
  tone?: "slate" | "indigo";
  children?: React.ReactNode;
  onRemove?: () => void;
  onUp?: () => void;
  onDown?: () => void;
}) {
  return (
    <div className="relative rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
              tone === "indigo" ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            {badge}
          </span>
          <div>
            <p className="font-medium text-slate-900">{title}</p>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {(onRemove || onUp || onDown) && (
          <div className="flex items-center gap-1 text-sm">
            {onUp && (
              <button type="button" onClick={onUp} className="rounded px-2 py-1 text-slate-400 hover:bg-slate-100">↑</button>
            )}
            {onDown && (
              <button type="button" onClick={onDown} className="rounded px-2 py-1 text-slate-400 hover:bg-slate-100">↓</button>
            )}
            {onRemove && (
              <button type="button" onClick={onRemove} className="rounded px-2 py-1 text-red-500 hover:bg-red-50">Remove</button>
            )}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
