const authTokenStorageKey = "lydian-gravity.auth-token";

function getSessionStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage;
}

export function getStoredAuthToken() {
  return getSessionStorage()?.getItem(authTokenStorageKey) ?? null;
}

export function storeAuthToken(token: string) {
  getSessionStorage()?.setItem(authTokenStorageKey, token);
}

export function clearStoredAuthToken() {
  getSessionStorage()?.removeItem(authTokenStorageKey);
}
