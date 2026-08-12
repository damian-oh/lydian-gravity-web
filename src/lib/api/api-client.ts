export class ApiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(status: number, message: string, detail: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

type ApiFetchOptions = Omit<RequestInit, "headers"> & {
  headers?: HeadersInit;
  token?: string | null;
};

// Called when a token-authenticated request comes back 401 (expired or revoked
// session). The auth provider registers its logout here so any screen's fetch
// tears the stale session down instead of leaving the app wedged.
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

function buildApiUrl(path: string) {
  return `${apiBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function getErrorMessage(status: number, detail: unknown) {
  if (typeof detail === "string") {
    return detail;
  }

  if (
    detail &&
    typeof detail === "object" &&
    "detail" in detail &&
    typeof detail.detail === "string"
  ) {
    return detail.detail;
  }

  if (status === 0) {
    return "Unable to reach the API. Check that the FastAPI server is running.";
  }

  return `Request failed with status ${status}.`;
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  // FastAPI labels bodyless responses (204 from DELETE) as application/json;
  // response.json() would throw on the empty body.
  const text = await response.text();

  return text ? (JSON.parse(text) as unknown) : null;
}

export async function apiFetch<T>(
  path: string,
  { token, headers, ...init }: ApiFetchOptions = {},
): Promise<T> {
  const requestHeaders = new Headers(headers);

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  try {
    const response = await fetch(buildApiUrl(path), {
      ...init,
      headers: requestHeaders,
    });
    const body = await parseResponseBody(response);

    if (!response.ok) {
      if (response.status === 401 && token) {
        // Only token-authenticated calls: a failed login form's own 401 is
        // not a session expiry.
        onUnauthorized?.();
      }

      throw new ApiError(
        response.status,
        getErrorMessage(response.status, body),
        body,
      );
    }

    return body as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      // A caller-initiated abort is not an API failure; let it propagate so
      // callers can recognize and ignore it.
      throw error;
    }

    throw new ApiError(0, getErrorMessage(0, null), null);
  }
}
