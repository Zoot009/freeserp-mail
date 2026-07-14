import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { registerAction } from "@/app/actions/auth";
import { AuthForm } from "../auth-form";

export default async function RegisterPage() {
  if (await getSession()) redirect("/projects");
  return <AuthForm mode="register" action={registerAction} />;
}
