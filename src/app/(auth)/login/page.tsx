import type { Metadata } from "next";

import { AuthPageShell } from "@/features/auth/components/auth-page-shell";
import { LoginCard } from "@/features/auth/components/login-card";

export const metadata: Metadata = {
  title: "Login | Lydian Gravity",
  description: "Sign in to continue building song sketches in Lydian Gravity.",
};

type LoginPageProps = Readonly<{
  searchParams: Promise<{
    registered?: string | string[];
  }>;
}>;

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { registered } = await searchParams;
  const registrationComplete = Array.isArray(registered)
    ? registered.includes("1")
    : registered === "1";

  return (
    <AuthPageShell>
      <LoginCard registrationComplete={registrationComplete} />
    </AuthPageShell>
  );
}
