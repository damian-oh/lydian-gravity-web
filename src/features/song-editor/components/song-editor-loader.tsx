"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PanelShell } from "@/components/ui/panel-shell";
import { useAuth } from "@/features/auth/providers/auth-provider";
import {
  getSong,
  saveSongArrangement,
} from "@/features/song-editor/lib/song-api";
import type { SongSketchModel } from "@/features/song-editor/lib/song-model";

import { SongEditorWorkspace } from "./song-editor-workspace";

export function SongEditorLoader({ songId }: Readonly<{ songId: string }>) {
  const { token } = useAuth();
  const [song, setSong] = useState<SongSketchModel | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (!token) {
        // Without a token the fetch never fires; surface that instead of
        // sitting on "loading" forever.
        setStatus("error");
        setError("Your session has ended. Sign in again to open this sketch.");

        return;
      }

      setStatus("loading");
      setError(null);

      void getSong(token, songId)
        .then((loadedSong) => {
          if (cancelled) {
            return;
          }

          setSong(loadedSong);
          setStatus("ready");
        })
        .catch((loadError) => {
          if (cancelled) {
            return;
          }

          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load this song.",
          );
          setStatus("error");
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [songId, token]);

  if (status === "loading") {
    return (
      <PanelShell
        eyebrow="Loading Song"
        title="Opening editor"
        description="Fetching the saved arrangement from the API."
        bodyClassName="text-sm font-semibold text-muted"
      >
        Loading...
      </PanelShell>
    );
  }

  if (status === "error" || !song || !token) {
    return (
      <PanelShell
        eyebrow="Song Error"
        title="Unable to open this sketch"
        description={error ?? "The requested sketch could not be loaded."}
        bodyClassName="space-y-4"
      >
        <Link
          href="/library"
          scroll={false}
          className="inline-flex rounded-full border border-highlight/80 bg-surface px-5 py-3 text-sm font-semibold text-foreground/72 transition hover:border-accent/30 hover:text-foreground focus:outline-none focus:ring-4 focus:ring-accent/20"
        >
          Back to Library
        </Link>
      </PanelShell>
    );
  }

  return (
    <SongEditorWorkspace
      song={song}
      onSaveArrangement={async (sections) => {
        const savedSong = await saveSongArrangement(token, song.id, sections);

        setSong(savedSong);

        return savedSong;
      }}
    />
  );
}
