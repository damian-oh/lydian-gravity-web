"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/features/auth/providers/auth-provider";

export function AuthenticatedAppShell({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status !== "anonymous") {
      return;
    }

    const next = encodeURIComponent(pathname);
    router.replace(`/login?next=${next}`);
  }, [pathname, router, status]);

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
