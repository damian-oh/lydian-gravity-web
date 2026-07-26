"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { isDemoMode } from "@/features/auth/lib/demo-config";
import { useAuth } from "@/features/auth/providers/auth-provider";

export function AuthenticatedAppShell({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { startDemoSession, status } = useAuth();
  const hasRequestedDemo = useRef(false);
  const hasHadSession = useRef(false);

  useEffect(() => {
    if (status === "authenticated") {
      hasHadSession.current = true;
    }
  }, [status]);

  useEffect(() => {
    if (status !== "anonymous") {
      return;
    }

    // Demo mode provisions a session where one is actually required, rather
    // than on every page under the root layout. startDemoSession moves the
    // status to "loading", so the redirect below only runs once the request
    // has come back and failed.
    //
    // Only for a visitor who arrived without a session, though: reaching
    // "anonymous" after having had one means they just signed out, and
    // handing them a fresh demo account would make that button do nothing.
    const isNewVisitor = !hasHadSession.current && !hasRequestedDemo.current;

    if (isDemoMode && isNewVisitor) {
      hasRequestedDemo.current = true;
      void startDemoSession();
      return;
    }

    const next = encodeURIComponent(pathname);
    router.replace(`/login?next=${next}`);
  }, [pathname, router, startDemoSession, status]);

  if (status !== "authenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <div className="rounded-[1.5rem] border border-highlight/80 bg-surface px-5 py-4 text-sm font-semibold text-foreground/72 shadow-[0_24px_70px_-46px_rgba(15,23,42,0.45)]">
          Checking your session...
        </div>
      </main>
    );
  }

  return <AppShell>{children}</AppShell>;
}
