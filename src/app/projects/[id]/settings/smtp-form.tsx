"use client";

import { useActionState } from "react";
import { Button, Input, Label } from "@/components/ui";
import { saveSmtpAction, testSmtpAction, type SmtpState } from "./actions";

interface SmtpInitial {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromEmail: string;
  fromName: string;
  hasPassword: boolean;
}

export function SmtpForm({
  projectId,
  initial,
}: {
  projectId: string;
  initial: SmtpInitial | null;
}) {
  const [saveState, saveAction, saving] = useActionState<SmtpState, FormData>(
    saveSmtpAction.bind(null, projectId),
    {}
  );
  const [testState, testAction, testing] = useActionState<SmtpState, FormData>(
    testSmtpAction.bind(null, projectId),
    {}
  );

  const state = saveState.message || saveState.error ? saveState : testState;

  return (
    <form className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="host">Host</Label>
          <Input id="host" name="host" defaultValue={initial?.host ?? ""} placeholder="smtp.example.com" required />
        </div>
        <div>
          <Label htmlFor="port">Port</Label>
          <Input id="port" name="port" type="number" defaultValue={initial?.port ?? 587} required />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="secure" defaultChecked={initial?.secure ?? false} />
        Use TLS (SSL) — enable for port 465
      </label>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="username">Username</Label>
          <Input id="username" name="username" defaultValue={initial?.username ?? ""} autoComplete="off" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder={initial?.hasPassword ? "•••••••• (unchanged)" : ""}
            autoComplete="new-password"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fromEmail">From email</Label>
          <Input id="fromEmail" name="fromEmail" type="email" defaultValue={initial?.fromEmail ?? ""} placeholder="hello@example.com" required />
        </div>
        <div>
          <Label htmlFor="fromName">From name</Label>
          <Input id="fromName" name="fromName" defaultValue={initial?.fromName ?? ""} placeholder="Acme" />
        </div>
      </div>

      {state.message && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{state.message}</p>
      )}
      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" formAction={saveAction} disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </Button>
        <Button type="submit" variant="secondary" formAction={testAction} disabled={testing}>
          {testing ? "Sending…" : "Send test email"}
        </Button>
      </div>
    </form>
  );
}
