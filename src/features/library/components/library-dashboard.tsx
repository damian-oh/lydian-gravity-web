"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PanelShell } from "@/components/ui/panel-shell";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { listSongs } from "@/features/song-editor/lib/song-api";
import type { SongSummaryModel } from "@/features/song-editor/lib/song-model";

function formatModeLabel(mode: string) {
  return `${mode.charAt(0).toUpperCase()}${mode.slice(1)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function LibraryDashboard() {
  const { token } = useAuth();
  const [songs, setSongs] = useState<readonly SongSummaryModel[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      setStatus("loading");
      setError(null);

      void listSongs(token)
        .then((nextSongs) => {
          if (cancelled) {
            return;
          }

          setSongs(nextSongs);
          setStatus("ready");
        })
        .catch((loadError) => {
          if (cancelled) {
            return;
          }

          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load the song library.",
          );
          setStatus("error");
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [token]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
            Song Library
          </p>
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Library
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">
              Open saved sketches, review arrangement scope, and continue a
              modal writing session.
            </p>
          </div>
        </div>

        <Link
          href="/songs/new"
          scroll={false}
          className="rounded-full bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-accent/25"
        >
          Create Sketch
        </Link>
      </header>

      <PanelShell
        eyebrow="Library Overview"
        title={
          status === "ready" && songs.length > 0
            ? `${songs.length} saved sketch${songs.length === 1 ? "" : "es"}`
            : "No sketches saved yet"
        }
        description="Saved sketches are loaded from the FastAPI SQLite-backed library."
        bodyClassName="space-y-6"
      >
        {status === "loading" ? (
          <div className="rounded-[1.3rem] border border-highlight/70 bg-background/55 p-5 text-sm font-semibold text-muted">
            Loading saved sketches...
          </div>
        ) : status === "error" ? (
          <div
            role="alert"
            className="rounded-[1.3rem] border border-rose-500/25 bg-rose-500/10 p-5 text-sm leading-6 text-rose-900 dark:text-rose-100"
          >
            {error}
          </div>
        ) : songs.length === 0 ? (
          <div className="rounded-[1.6rem] border border-dashed border-highlight bg-background/40 p-6 sm:p-7">
            <div className="max-w-xl space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-foreground/45">
                Next Step
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Start a new sketch.
              </h2>
              <p className="text-sm leading-7 text-muted sm:text-base">
                Create a tonal center, mode, tempo, and first section, then save
                the arrangement from the editor.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/songs/new"
                scroll={false}
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-accent/25"
              >
                Create Sketch
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {songs.map((song) => (
              <Link
                key={song.id}
                href={`/songs/${song.id}`}
                scroll={false}
                className="rounded-[1.35rem] border border-highlight/80 bg-background/45 p-5 transition hover:border-accent/30 hover:bg-background/70 focus:outline-none focus:ring-4 focus:ring-accent/15"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold tracking-tight text-foreground">
                      {song.title}
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      {song.masterTonalCenter}{" "}
                      {formatModeLabel(song.masterMode)}
                    </p>
                  </div>
                  <span className="rounded-full border border-highlight/80 bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/65">
                    {song.sectionCount} sections
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full border border-highlight/80 bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/65">
                    {song.tempoBpm} BPM
                  </span>
                  <span className="rounded-full border border-highlight/80 bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/65">
                    {song.timeSignature}
                  </span>
                </div>

                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/45">
                  Updated {formatDate(song.updatedAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </PanelShell>
    </div>
  );
}
