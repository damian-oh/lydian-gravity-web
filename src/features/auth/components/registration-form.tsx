"use client";

import { useRouter } from "next/navigation";
import {
  startTransition,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { registerUser } from "@/features/auth/lib/register-user";

import { AuthInputField } from "./auth-input-field";
import { AuthMessage } from "./auth-message";
import { AuthPrimaryButton } from "./auth-primary-button";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

type RegistrationFields = {
  email: string;
  password: string;
  confirmPassword: string;
};

type RegistrationErrorField = keyof RegistrationFields | "form";
type RegistrationErrors = Partial<Record<RegistrationErrorField, string>>;

const INITIAL_VALUES: RegistrationFields = {
  email: "",
  password: "",
  confirmPassword: "",
};

function validateRegistrationForm(
  values: RegistrationFields,
): RegistrationErrors {
  const errors: RegistrationErrors = {};
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

  if (!values.confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

function clearErrors(
  current: RegistrationErrors,
  fields: RegistrationErrorField[],
) {
  const next = { ...current };

  for (const field of fields) {
    delete next[field];
  }

  return next;
}

export function RegistrationForm() {
  const router = useRouter();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.currentTarget;
    const field = name as keyof RegistrationFields;

    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    const fieldsToClear: RegistrationErrorField[] =
      field === "password" || field === "confirmPassword"
        ? ["password", "confirmPassword", "form"]
        : [field, "form"];

    setErrors((current) => clearErrors(current, fieldsToClear));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateRegistrationForm(values);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await registerUser({
        email: values.email.trim(),
        password: values.password,
      });

      if (result.ok) {
        startTransition(() => {
          router.push("/login?registered=1");
        });
        return;
      }

      setErrors({ form: result.message });
    } finally {
      // Always re-enable the form: an interrupted navigation on the success
      // path must not leave the button permanently dead.
      setIsSubmitting(false);
    }
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
        autoComplete="new-password"
        placeholder="Create a password"
        value={values.password}
        onChange={handleChange}
        disabled={isSubmitting}
        label="Password"
        hint="Minimum 8 characters"
        error={errors.password}
      />

      <AuthInputField
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        placeholder="Re-enter your password"
        value={values.confirmPassword}
        onChange={handleChange}
        disabled={isSubmitting}
        label="Confirm password"
        error={errors.confirmPassword}
      />

      <AuthPrimaryButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating Account..." : "Create Account"}
      </AuthPrimaryButton>
    </form>
  );
}
