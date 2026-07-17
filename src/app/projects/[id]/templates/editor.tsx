"use client";

import { type ChangeEvent, useActionState, useState } from "react";
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
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | undefined>();

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(undefined);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setUploaded(data.url as string);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

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

          <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <label className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700 hover:bg-slate-50">
                {uploading ? "Uploading…" : "Upload image"}
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
              <span className="text-xs text-slate-400">PNG, JPG, GIF, WEBP, SVG · max 5 MB</span>
            </div>
            {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
            {uploaded && (
              <div className="mt-2">
                <p className="mb-1 text-xs text-slate-500">
                  Uploaded ✓ — paste this into your HTML where you want the image:
                </p>
                <textarea
                  readOnly
                  onFocus={(e) => e.target.select()}
                  rows={2}
                  className="w-full rounded border border-slate-300 px-2 py-1 font-mono text-xs"
                  value={`<img src="${uploaded}" alt="" style="max-width:100%;display:block" />`}
                />
              </div>
            )}
          </div>
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
