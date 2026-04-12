import type { Metadata } from "next";

import { AuthPageShell } from "@/features/auth/components/auth-page-shell";
import { RegistrationCard } from "@/features/auth/components/registration-card";

export const metadata: Metadata = {
  title: "Register | Lydian Gravity",
  description:
    "Create your Lydian Gravity account and start building song sketches.",
};

export default function RegisterPage() {
  return (
    <AuthPageShell>
      <RegistrationCard />
    </AuthPageShell>
  );
}
