"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  formatAuthError,
  getCurrentUser,
  requestAccessToken,
  requestDemoSession,
  type AuthCredentials,
  type AuthUser,
} from "@/features/auth/lib/auth-api";
import {
  clearStoredAuthToken,
  getStoredAuthToken,
  storeAuthToken,
} from "@/features/auth/lib/auth-token";
import { setUnauthorizedHandler } from "@/lib/api/api-client";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = Readonly<{
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
  login: (
    credentials: AuthCredentials,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  startDemoSession: () => Promise<
    { ok: true } | { ok: false; message: string }
  >;
  logout: () => void;
  refreshCurrentUser: () => Promise<void>;
}>;

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  // The server render cannot see sessionStorage, so both server and client
  // must start from the same "loading" state; the mount effect below resolves
  // it. Reading storage in an initializer caused hydration mismatches.
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const logout = useCallback(() => {
    clearStoredAuthToken();
    setToken(null);
    setUser(null);
    setStatus("anonymous");
  }, []);

  const loadCurrentUser = useCallback(async (activeToken: string) => {
    const currentUser = await getCurrentUser(activeToken);

    setToken(activeToken);
    setUser(currentUser);
    setStatus("authenticated");
  }, []);

  const startDemoSession = useCallback(async () => {
    const previousStatus = status;

    setStatus("loading");

    try {
      const authToken = await requestDemoSession();

      storeAuthToken(authToken.access_token);
      await loadCurrentUser(authToken.access_token);

      return { ok: true } as const;
    } catch (error) {
      // Restore what this interrupted. The request never touched the stored
      // token, so a failure must not clear one that was already there.
      setStatus(previousStatus === "loading" ? "anonymous" : previousStatus);

      return {
        ok: false,
        message: formatAuthError(error),
      } as const;
    }
  }, [loadCurrentUser, status]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storedToken = getStoredAuthToken();

      if (!storedToken) {
        setStatus("anonymous");

        return;
      }

      void loadCurrentUser(storedToken).catch(logout);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadCurrentUser, logout]);

  useEffect(() => {
    setUnauthorizedHandler(logout);

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [logout]);

  const login = useCallback(
    async (credentials: AuthCredentials) => {
      try {
        const authToken = await requestAccessToken(credentials);

        storeAuthToken(authToken.access_token);
        await loadCurrentUser(authToken.access_token);

        return { ok: true } as const;
      } catch (error) {
        // A failed attempt must not tear down a session that already exists
        // (e.g. a signed-in user retyping a password on /login). Clearing
        // happens only through logout or the 401 handler.
        return {
          ok: false,
          message: formatAuthError(error),
        } as const;
      }
    },
    [loadCurrentUser],
  );

  const refreshCurrentUser = useCallback(async () => {
    const activeToken = token ?? getStoredAuthToken();

    if (!activeToken) {
      logout();
      return;
    }

    await loadCurrentUser(activeToken);
  }, [loadCurrentUser, logout, token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      token,
      login,
      startDemoSession,
      logout,
      refreshCurrentUser,
    }),
    [
      login,
      logout,
      refreshCurrentUser,
      startDemoSession,
      status,
      token,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
