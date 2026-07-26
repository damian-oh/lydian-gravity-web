"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { getSafeNextPath } from "@/features/auth/lib/next-path";
import { useAuth } from "@/features/auth/providers/auth-provider";

import { AuthMessage } from "./auth-message";

/**
 * Manual way into the demo.
 *
 * The app shell provisions a session when a visitor asks for a page that needs
 * one, but nothing does so on the login page -- without this button a visitor
 * who exits the demo would be stranded there with no account to sign in with.
 */
export function DemoSessionButton({
  nextPath,
}: Readonly<{ nextPath?: string }>) {
  const router = useRouter();
  const { startDemoSession, status } = useAuth();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsStarting(true);
    setError(null);

    const result = await startDemoSession();

    if (result.ok) {
      startTransition(() => {
        router.push(getSafeNextPath(nextPath));
      });
      return;
    }

    setError(result.message);
    setIsStarting(false);
  }

  // Nothing to offer someone who already has a session, or whose session is
  // still being resolved. isStarting keeps the button mounted through its own
  // request, which moves the status to "loading".
  if (status !== "anonymous" && !isStarting) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-highlight/80" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/45">
          or
        </span>
        <span className="h-px flex-1 bg-highlight/80" />
      </div>

      {error ? <AuthMessage variant="error">{error}</AuthMessage> : null}

      <button
        type="button"
        onClick={handleClick}
        disabled={isStarting}
        className="inline-flex w-full items-center justify-center rounded-2xl border border-highlight/80 bg-background/60 px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-foreground/72 transition hover:border-accent/30 hover:text-foreground focus:outline-none focus:ring-4 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isStarting ? "Starting Demo..." : "Continue As Demo User"}
      </button>

      <p className="text-center text-xs leading-5 text-foreground/55">
        No sign-up required. You get a private sandbox with a starter song.
      </p>
    </div>
  );
}
