"use client";

import Link from "next/link";

import { useAuth } from "@/features/auth/providers/auth-provider";

/**
 * Landing page header nav that recognizes an existing session. Without this,
 * a signed-in user arriving on the landing page sees Login/Register and reads
 * it as having been signed out.
 *
 * While the session check is pending ("loading"), this renders the same
 * Login/Register markup as the server HTML, so anonymous visitors see no
 * flicker and hydration stays consistent.
 */
export function LandingAuthNav() {
  const { status, user } = useAuth();

  if (status === "authenticated") {
    return (
      <nav className="flex items-center gap-3 text-sm font-semibold">
        <span className="max-w-44 truncate text-foreground/55">
          {user?.is_demo ? "Demo visitor" : (user?.email ?? null)}
        </span>
        <Link
          href="/library"
          className="rounded-full bg-accent px-4 py-2 uppercase tracking-[0.16em] text-slate-950 transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-accent/25"
        >
          Open app
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-3 text-sm font-semibold">
      <Link
        href="/login"
        className="rounded-full px-4 py-2 text-foreground/70 transition hover:bg-highlight/70 hover:text-foreground focus:outline-none focus:ring-4 focus:ring-highlight/80"
      >
        Login
      </Link>
      <Link
        href="/register"
        className="rounded-full bg-accent px-4 py-2 uppercase tracking-[0.16em] text-slate-950 transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-accent/25"
      >
        Register
      </Link>
    </nav>
  );
}
