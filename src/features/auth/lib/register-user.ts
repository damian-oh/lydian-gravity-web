export type RegistrationPayload = {
  email: string;
  password: string;
};

export type RegistrationResult = { ok: true } | { ok: false; message: string };

export async function registerUser(
  payload: RegistrationPayload,
): Promise<RegistrationResult> {
  void payload;

  return {
    ok: false,
    message:
      "Registration is not available yet. Connect the auth API to enable account creation.",
  };
}
