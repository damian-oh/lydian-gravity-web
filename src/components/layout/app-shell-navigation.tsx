"use client";

import { createContext, useContext } from "react";

export type AppShellNavigationGuard = Readonly<{
  message: string;
}>;

type AppShellNavigationContextValue = Readonly<{
  confirmNavigation: (href: string) => boolean;
  setNavigationGuard: (guard: AppShellNavigationGuard | null) => void;
}>;

const fallbackContextValue: AppShellNavigationContextValue = {
  confirmNavigation: () => true,
  setNavigationGuard: () => {},
};

export const AppShellNavigationContext =
  createContext<AppShellNavigationContextValue | null>(null);

export function useAppShellNavigation() {
  return useContext(AppShellNavigationContext) ?? fallbackContextValue;
}
