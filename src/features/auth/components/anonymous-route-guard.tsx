"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { getSafeNextPath } from "@/features/auth/lib/next-path";
import { useAuth } from "@/features/auth/providers/auth-provider";

/**
 * Sends visitors who already hold a session away from the auth pages, into
 * the app. A signed-in user landing on /login or /register otherwise sees a
 * sign-in form that implies they have no session.
 */
export function AnonymousRouteGuard({
  children,
}: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useAuth();

  const nextParam = searchParams.get("next");

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(getSafeNextPath(nextParam ?? undefined));
    }
  }, [nextParam, router, status]);

  // Children render even while the session check is pending: anonymous
  // visitors (the common case) must see the form immediately, not a blank
  // page. An already-authenticated visitor sees it only for the tick it
  // takes the redirect above to land.
  return children;
}
