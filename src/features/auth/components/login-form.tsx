import { AuthInputField } from "./auth-input-field";
import { AuthPrimaryButton } from "./auth-primary-button";

export function LoginForm() {
  return (
    <form className="space-y-5">
      <AuthInputField
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        label="Email address"
      />

      <AuthInputField
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Enter your password"
        required
        minLength={8}
        label="Password"
        hint="Secure entry"
      />

      <AuthPrimaryButton type="button">
        Sign In
      </AuthPrimaryButton>
    </form>
  );
}
