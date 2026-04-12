import type { ReactNode } from "react";

type AuthPageShellProps = Readonly<{
  children: ReactNode;
}>;

export function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12 text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_35%)] dark:bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.16),_transparent_35%)]" />
      <div className="absolute left-[-7rem] top-24 h-72 w-72 rounded-full bg-highlight/70 blur-3xl" />
      <div className="absolute bottom-[-7rem] right-[-5rem] h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-highlight to-transparent" />

      {children}
    </main>
  );
}
