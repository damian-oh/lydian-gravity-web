"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { hasSignedOutMark } from "@/features/auth/lib/auth-token";
import { isDemoMode } from "@/features/auth/lib/demo-config";
import { useAuth } from "@/features/auth/providers/auth-provider";

export function AuthenticatedAppShell({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { startDemoSession, status } = useAuth();
  const hasRequestedDemo = useRef(false);
  const demoRequestFailed = useRef(false);

  useEffect(() => {
    if (status !== "anonymous") {
      return;
    }

    // Demo mode provisions a session where one is actually required, rather
    // than on every page under the root layout.
    //
    // Only for a visitor who never signed out in this tab, though: the
    // sessionStorage mark set by logout means they explicitly ended a
    // session, and handing them a fresh demo account would make that button
    // do nothing. The mark (rather than component state) matters because
    // this shell unmounts on logout and remounts on Back navigation.
    if (isDemoMode && !hasSignedOutMark()) {
      if (!hasRequestedDemo.current) {
        hasRequestedDemo.current = true;
        void startDemoSession().then((result) => {
          // The status transitions inside startDemoSession re-run this
          // effect, and the restore-on-failure path lands back on
          // "anonymous"; this flag routes that re-run to the login redirect.
          if (!result.ok) {
            demoRequestFailed.current = true;
          }
        });
        return;
      }

      if (!demoRequestFailed.current) {
        // The request is still in flight. This effect can re-fire before the
        // "loading" status commits (e.g. searchParams identity changes right
        // after a client-side navigation); redirecting here would bounce a
        // provisioning visitor to /login.
        return;
      }
    }

    // Include the query string so signing back in restores the full location,
    // not just the pathname.
    const search = searchParams.toString();
    const next = encodeURIComponent(search ? `${pathname}?${search}` : pathname);
    router.replace(`/login?next=${next}`);
  }, [pathname, router, searchParams, startDemoSession, status]);

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
