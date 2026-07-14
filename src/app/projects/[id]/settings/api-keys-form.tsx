"use client";

import { useActionState } from "react";
import { Button, Input, FormError } from "@/components/ui";
import { createApiKeyAction, type ApiKeyState } from "./actions";

export function ApiKeyCreateForm({ projectId }: { projectId: string }) {
  const action = createApiKeyAction.bind(null, projectId);
  const [state, formAction, pending] = useActionState<ApiKeyState, FormData>(
    action,
    {}
  );

  return (
    <div>
      <form action={formAction} className="flex items-end gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Key name
          </label>
          <Input name="name" placeholder="e.g. Production server" required />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Generating…" : "Create key"}
        </Button>
      </form>

      <FormError message={state.error} />

      {state.rawKey && (
        <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-900">
            Copy your API key now — it won&apos;t be shown again.
          </p>
          <code className="mt-2 block break-all rounded bg-white px-3 py-2 font-mono text-sm text-slate-800">
            {state.rawKey}
          </code>
        </div>
      )}
    </div>
  );
}
