import { redirect } from "next/navigation";
import { getValidSession } from "@/lib/session";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const session = await getValidSession();
  if (session?.user) {
    redirect("/");
  }

  return <LoginForm />;
}
