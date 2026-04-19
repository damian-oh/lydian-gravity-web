import { createAccount, formatAuthError } from "@/features/auth/lib/auth-api";

export type RegistrationPayload = {
  email: string;
  password: string;
};

export type RegistrationResult = { ok: true } | { ok: false; message: string };

export async function registerUser(
  payload: RegistrationPayload,
): Promise<RegistrationResult> {
  try {
    await createAccount(payload);

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: formatAuthError(error),
    };
  }
}
