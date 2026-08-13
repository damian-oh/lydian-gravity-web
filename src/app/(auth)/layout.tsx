import { Suspense, type ReactNode } from "react";

import { AnonymousRouteGuard } from "@/features/auth/components/anonymous-route-guard";

type AuthLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    // Suspense boundary: AnonymousRouteGuard reads useSearchParams (for the
    // next param), which bails out of static prerender.
    <Suspense>
      <AnonymousRouteGuard>{children}</AnonymousRouteGuard>
    </Suspense>
  );
}
