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
import { isDemoMode } from "@/features/auth/lib/demo-config";

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
  const [initialToken] = useState(() => getStoredAuthToken());
  // In demo mode the first paint must not be "anonymous", or the app shell
  // redirects to /login before the demo session finishes provisioning.
  const [status, setStatus] = useState<AuthStatus>(
    initialToken || isDemoMode ? "loading" : "anonymous",
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(initialToken);

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
    setStatus("loading");

    try {
      const authToken = await requestDemoSession();

      storeAuthToken(authToken.access_token);
      await loadCurrentUser(authToken.access_token);

      return { ok: true } as const;
    } catch (error) {
      logout();

      return {
        ok: false,
        message: formatAuthError(error),
      } as const;
    }
  }, [loadCurrentUser, logout]);

  useEffect(() => {
    if (!initialToken && !isDemoMode) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (initialToken) {
        void loadCurrentUser(initialToken).catch(logout);
        return;
      }

      // No stored token and demo mode is on: provision one. If the API has
      // demo mode disabled this falls through to logout(), which lands the
      // visitor on the normal login redirect rather than hanging on the
      // loading state.
      void startDemoSession();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [initialToken, loadCurrentUser, logout, startDemoSession]);

  const login = useCallback(
    async (credentials: AuthCredentials) => {
      try {
        const authToken = await requestAccessToken(credentials);

        storeAuthToken(authToken.access_token);
        await loadCurrentUser(authToken.access_token);

        return { ok: true } as const;
      } catch (error) {
        clearStoredAuthToken();
        setToken(null);
        setUser(null);
        setStatus("anonymous");

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
