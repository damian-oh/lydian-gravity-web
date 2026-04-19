import type { ReactNode } from "react";

import { AuthenticatedAppShell } from "@/features/auth/components/authenticated-app-shell";

type AppLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function AppLayout({ children }: AppLayoutProps) {
  return <AuthenticatedAppShell>{children}</AuthenticatedAppShell>;
}
