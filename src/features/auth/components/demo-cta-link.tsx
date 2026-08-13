"use client";

import Link from "next/link";
import { type ReactNode } from "react";

import { clearSignedOutMark } from "@/features/auth/lib/auth-token";

/**
 * "Try the live demo" link for the landing page. Clearing the signed-out
 * mark keeps the CTA's promise of instant provisioning: after "Exit demo",
 * the mark would otherwise route this click to /login instead of minting a
 * fresh demo session.
 */
export function DemoCtaLink({
  className,
  children,
}: Readonly<{ className?: string; children: ReactNode }>) {
  return (
    <Link href="/library" onClick={clearSignedOutMark} className={className}>
      {children}
    </Link>
  );
}
