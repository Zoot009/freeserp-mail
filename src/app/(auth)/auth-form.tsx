"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Input, Label, FormError } from "@/components/ui";
import type { AuthState } from "@/app/actions/auth";

type Action = (prev: AuthState, formData: FormData) => Promise<AuthState>;

export function AuthForm({
  mode,
  action,
}: {
  mode: "login" | "register";
  action: Action;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    {}
  );
  const isLogin = mode === "login";

  return (
    <div className="mx-auto mt-24 w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">
          {isLogin ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isLogin
            ? "Sign in to your automation dashboard."
            : "Set up your self-hosted email automation."}
        </p>
      </div>

      <form action={formAction} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
        </div>
        <FormError message={state.error} />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500">
        {isLogin ? (
          <>
            No account?{" "}
            <Link href="/register" className="font-medium text-indigo-600 hover:underline">
              Register
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-indigo-600 hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
