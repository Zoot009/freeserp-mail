"use client";

import { useActionState, useState } from "react";
import { Button, Input, Label, Textarea, FormError } from "@/components/ui";
import type { TemplateState } from "./actions";

interface Initial {
  name: string;
  subject: string;
  html: string;
  text: string;
}

type Action = (prev: TemplateState, formData: FormData) => Promise<TemplateState>;

export function TemplateEditor({
  action,
  initial,
  submitLabel,
}: {
  action: Action;
  initial?: Initial;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<TemplateState, FormData>(
    action,
    {}
  );
  const [html, setHtml] = useState(initial?.html ?? DEFAULT_HTML);

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Template name</Label>
          <Input id="name" name="name" defaultValue={initial?.name} placeholder="Welcome email" required />
        </div>
        <div>
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" name="subject" defaultValue={initial?.subject} placeholder="Welcome, {{ firstName }}!" required />
        </div>
        <div>
          <Label htmlFor="html">HTML body</Label>
          <Textarea
            id="html"
            name="html"
            rows={16}
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-slate-400">
            Use <code>{"{{ firstName }}"}</code>, <code>{"{{ email }}"}</code>, event
            properties, and <code>{"{{ unsubscribeUrl }}"}</code>.
          </p>
        </div>
        <div>
          <Label htmlFor="text">Plain-text version (optional)</Label>
          <Textarea id="text" name="text" rows={4} defaultValue={initial?.text} />
        </div>

        <FormError message={state.error} />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>

      <div>
        <Label>Preview</Label>
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <iframe
            title="preview"
            className="h-[520px] w-full"
            srcDoc={html}
            sandbox=""
          />
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Variables are shown literally here; they&apos;re filled in at send time.
        </p>
      </div>
    </form>
  );
}

// Content-only by default — your global Branding adds the header, colors, and
// footer/unsubscribe automatically. (A full <html> document is left un-wrapped.)
const DEFAULT_HTML = `<h1 style="margin:0 0 12px">Welcome, {{ firstName }}!</h1>
<p>Thanks for signing up. We're glad you're here.</p>
<p><a href="#" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Get started</a></p>`;
