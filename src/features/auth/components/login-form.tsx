"use client";

import { useRouter } from "next/navigation";
import {
  startTransition,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { getSafeNextPath } from "@/features/auth/lib/next-path";
import { useAuth } from "@/features/auth/providers/auth-provider";

import { AuthInputField } from "./auth-input-field";
import { AuthMessage } from "./auth-message";
import { AuthPrimaryButton } from "./auth-primary-button";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

type LoginFields = {
  email: string;
  password: string;
};

type LoginErrorField = keyof LoginFields | "form";
type LoginErrors = Partial<Record<LoginErrorField, string>>;

const initialValues: LoginFields = {
  email: "",
  password: "",
};

function validateLoginForm(values: LoginFields): LoginErrors {
  const errors: LoginErrors = {};
  const email = values.email.trim();

  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }

  return errors;
}

function clearErrors(current: LoginErrors, fields: LoginErrorField[]) {
  const next = { ...current };

  for (const field of fields) {
    delete next[field];
  }

  return next;
}

export function LoginForm({ nextPath }: Readonly<{ nextPath?: string }>) {
  const router = useRouter();
  const { login } = useAuth();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.currentTarget;
    const field = name as keyof LoginFields;

    setValues((current) => ({
      ...current,
      [field]: value,
    }));
    setErrors((current) => clearErrors(current, [field, "form"]));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateLoginForm(values);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const result = await login({
      email: values.email.trim(),
      password: values.password,
    });

    if (result.ok) {
      startTransition(() => {
        router.push(getSafeNextPath(nextPath));
      });
      return;
    }

    setErrors({ form: result.message });
    setIsSubmitting(false);
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {errors.form ? (
        <AuthMessage variant="error">{errors.form}</AuthMessage>
      ) : null}

      <AuthInputField
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={values.email}
        onChange={handleChange}
        disabled={isSubmitting}
        label="Email address"
        error={errors.email}
      />

      <AuthInputField
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Enter your password"
        value={values.password}
        onChange={handleChange}
        disabled={isSubmitting}
        minLength={8}
        label="Password"
        hint="Secure entry"
        error={errors.password}
      />

      <AuthPrimaryButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing In..." : "Sign In"}
      </AuthPrimaryButton>
    </form>
  );
}
