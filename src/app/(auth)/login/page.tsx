import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { loginAction } from "@/app/actions/auth";
import { AuthForm } from "../auth-form";

export default async function LoginPage() {
  if (await getSession()) redirect("/projects");
  return <AuthForm mode="login" action={loginAction} />;
}
