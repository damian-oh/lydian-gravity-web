"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { useAuth } from "@/features/auth/providers/auth-provider";

import { AuthMessage } from "./auth-message";

/**
 * Manual way into the demo.
 *
 * The provider auto-provisions a session on mount, but it does not remount
 * after a logout -- without this button a visitor who exits the demo would be
 * stranded on the login page with no account to sign in with.
 */
export function DemoSessionButton() {
  const router = useRouter();
  const { startDemoSession } = useAuth();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsStarting(true);
    setError(null);

    const result = await startDemoSession();

    if (result.ok) {
      startTransition(() => {
        router.push("/library");
      });
      return;
    }

    setError(result.message);
    setIsStarting(false);
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
