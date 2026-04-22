import { AuthCard } from "./auth-card";
import { AuthTextLink } from "./auth-text-link";
import { RegistrationForm } from "./registration-form";

export function RegistrationCard() {
  return (
    <AuthCard
      title="Register"
      description="Create your Lydian Gravity account to start building song sketches."
      footer={
        <p className="text-sm text-foreground/65">
          Already have an account?{" "}
          <AuthTextLink href="/login">Sign In</AuthTextLink>
        </p>
      }
    >
      <RegistrationForm />
    </AuthCard>
  );
}
