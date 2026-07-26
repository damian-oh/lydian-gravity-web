import { isDemoMode } from "@/features/auth/lib/demo-config";

import { AuthCard } from "./auth-card";
import { AuthMessage } from "./auth-message";
import { AuthTextLink } from "./auth-text-link";
import { DemoSessionButton } from "./demo-session-button";
import { LoginForm } from "./login-form";

type LoginCardProps = Readonly<{
  nextPath?: string;
  registrationComplete?: boolean;
}>;

export function LoginCard({
  nextPath,
  registrationComplete = false,
}: LoginCardProps) {
  return (
    <AuthCard
      title="Sign In"
      description="Sign in to continue building song sketches in Lydian Gravity."
      status={
        registrationComplete ? (
          <AuthMessage variant="success">
            Account created. Sign in with your new credentials.
          </AuthMessage>
        ) : undefined
      }
      footer={
        <p className="text-sm text-foreground/65">
          Need an account?{" "}
          <AuthTextLink href="/register">Register</AuthTextLink>
        </p>
      }
    >
      <LoginForm nextPath={nextPath} />
      {isDemoMode ? <DemoSessionButton nextPath={nextPath} /> : null}
    </AuthCard>
  );
}
