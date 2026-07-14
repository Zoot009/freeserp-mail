"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { credentialsSchema } from "@/schemas";
import { hashPassword, verifyPassword, createSession, destroySession } from "@/lib/session";
import { env } from "@/lib/env";

export interface AuthState {
  error?: string;
}

export async function registerAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  if (!env.allowRegistration) {
    // Allow the very first user even if registration is closed, so a fresh
    // install is always bootstrappable.
    const count = await prisma.user.count();
    if (count > 0) return { error: "Registration is disabled." };
  }

  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const user = await prisma.user.create({
    data: { email, passwordHash: await hashPassword(parsed.data.password) },
  });
  await createSession({ userId: user.id, email: user.email });
  redirect("/projects");
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Invalid email or password." };
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }

  await createSession({ userId: user.id, email: user.email });
  redirect("/projects");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
