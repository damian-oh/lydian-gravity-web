import { ApiError, apiFetch } from "@/lib/api/api-client";

export type AuthUser = Readonly<{
  id: number;
  email: string;
  created_at: string;
}>;

export type AuthToken = Readonly<{
  access_token: string;
  token_type: "bearer";
}>;

export type AuthCredentials = Readonly<{
  email: string;
  password: string;
}>;

export function formatAuthError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 422) {
      return "Check the email and password fields and try again.";
    }

    return error.message;
  }

  return "Something went wrong. Try again.";
}

export async function createAccount(credentials: AuthCredentials) {
  return apiFetch<AuthUser>("/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });
}

export async function requestAccessToken(credentials: AuthCredentials) {
  const body = new URLSearchParams({
    username: credentials.email,
    password: credentials.password,
  });

  return apiFetch<AuthToken>("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
}

export async function requestDemoSession() {
  return apiFetch<AuthToken>("/auth/demo-session", {
    method: "POST",
  });
}

export async function getCurrentUser(token: string) {
  return apiFetch<AuthUser>("/users/me", {
    method: "GET",
    token,
  });
}
