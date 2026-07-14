"use client";

import { useActionState, useState } from "react";
import { Button, Input, Label, Textarea } from "@/components/ui";
import { renderBrandedEmail, type BrandingView } from "@/lib/branded-email";
import {
  saveBrandingAction,
  sendBrandingTestAction,
  type BrandingState,
} from "./actions";

const SAMPLE = `<h1 style="margin:0 0 12px">Welcome aboard, Jane!</h1>
<p>Thanks for joining. This preview shows how your branding wraps every email you send.</p>
<p><a href="#" style="display:inline-block;background:{{color}};color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Get started</a></p>`;

export function BrandingForm({
  projectId,
  initial,
}: {
  projectId: string;
  initial: BrandingView;
}) {
  const [b, setB] = useState<BrandingView>(initial);
  const [saveState, saveAction, saving] = useActionState<BrandingState, FormData>(
    saveBrandingAction.bind(null, projectId),
    {}
  );
  const [testState, testAction, testing] = useActionState<BrandingState, FormData>(
    sendBrandingTestAction.bind(null, projectId),
    {}
  );
  const state = saveState.message || saveState.error ? saveState : testState;

  const set = (patch: Partial<BrandingView>) => setB((prev) => ({ ...prev, ...patch }));

  const previewHtml = renderBrandedEmail(
    SAMPLE.replace("{{color}}", b.brandColor || "#4f46e5"),
    b,
    { unsubscribeUrl: "#" }
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form action={saveAction} className="space-y-4">
        {/* hidden mirrors so the server action receives current values */}
        {(
          [
            "brandName",
            "logoUrl",
            "brandColor",
            "senderName",
            "footerText",
            "address",
            "unsubscribeText",
            "socialInstagram",
            "socialX",
            "socialLinkedin",
          ] as (keyof BrandingView)[]
        ).map((k) => (
          <input key={k} type="hidden" name={k} value={b[k]} />
        ))}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Brand name</Label>
            <Input value={b.brandName} onChange={(e) => set({ brandName: e.target.value })} placeholder="FreeSERP" />
          </div>
          <div>
            <Label>Brand color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={b.brandColor}
                onChange={(e) => set({ brandColor: e.target.value })}
                className="h-9 w-10 rounded border border-slate-300"
              />
              <Input value={b.brandColor} onChange={(e) => set({ brandColor: e.target.value })} className="op-mono" />
            </div>
          </div>
        </div>

        <div>
          <Label>Logo URL</Label>
          <Input value={b.logoUrl} onChange={(e) => set({ logoUrl: e.target.value })} placeholder="https://…/logo.png" />
        </div>

        <div>
          <Label>Sender name</Label>
          <Input value={b.senderName} onChange={(e) => set({ senderName: e.target.value })} placeholder="FreeSERP Team" />
        </div>

        <div>
          <Label>Footer text</Label>
          <Textarea rows={2} value={b.footerText} onChange={(e) => set({ footerText: e.target.value })} placeholder="FreeSERP — the free rank tracker." />
        </div>

        <div>
          <Label>Postal address</Label>
          <Input value={b.address} onChange={(e) => set({ address: e.target.value })} placeholder="123 Street, City, Country" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Instagram</Label>
            <Input value={b.socialInstagram} onChange={(e) => set({ socialInstagram: e.target.value })} placeholder="https://…" />
          </div>
          <div>
            <Label>X</Label>
            <Input value={b.socialX} onChange={(e) => set({ socialX: e.target.value })} placeholder="https://…" />
          </div>
          <div>
            <Label>LinkedIn</Label>
            <Input value={b.socialLinkedin} onChange={(e) => set({ socialLinkedin: e.target.value })} placeholder="https://…" />
          </div>
        </div>

        <div>
          <Label>Unsubscribe text</Label>
          <Input value={b.unsubscribeText} onChange={(e) => set({ unsubscribeText: e.target.value })} />
        </div>

        {state.message && <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.message}</p>}
        {state.error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save branding"}</Button>
          <input name="testEmail" placeholder="you@example.com" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <Button type="submit" variant="secondary" formAction={testAction} disabled={testing}>
            {testing ? "Sending…" : "Send test"}
          </Button>
        </div>
      </form>

      <div>
        <Label>Live preview</Label>
        <div className="overflow-hidden rounded-lg border border-[#e6e8eb]">
          <iframe title="branding-preview" className="h-[560px] w-full bg-white" srcDoc={previewHtml} sandbox="" />
        </div>
      </div>
    </div>
  );
}
