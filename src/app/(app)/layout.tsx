import { Suspense, type ReactNode } from "react";

import { AuthenticatedAppShell } from "@/features/auth/components/authenticated-app-shell";

type AppLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    // Suspense boundary: AuthenticatedAppShell reads useSearchParams (to build
    // the login redirect's next param), which bails out of static prerender.
    <Suspense>
      <AuthenticatedAppShell>{children}</AuthenticatedAppShell>
    </Suspense>
  );
}
