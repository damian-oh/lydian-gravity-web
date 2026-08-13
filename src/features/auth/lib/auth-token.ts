const authTokenStorageKey = "lydian-gravity.auth-token";
const signedOutStorageKey = "lydian-gravity.signed-out";

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

// The signed-out mark distinguishes "this tab never had a session" from "the
// user explicitly signed out". Demo mode auto-provisions a session for the
// former but must not for the latter, and the signal has to outlive component
// unmounts (e.g. Back onto a protected history entry after logout), so it
// lives in sessionStorage next to the token rather than in React state.
export function markSignedOut() {
  getSessionStorage()?.setItem(signedOutStorageKey, "1");
}

export function clearSignedOutMark() {
  getSessionStorage()?.removeItem(signedOutStorageKey);
}

export function hasSignedOutMark() {
  return getSessionStorage()?.getItem(signedOutStorageKey) != null;
}
