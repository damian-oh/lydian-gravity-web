"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PanelShell } from "@/components/ui/panel-shell";
import { useAuth } from "@/features/auth/providers/auth-provider";
import {
  deleteSong,
  listSongs,
  updateSongTitle,
} from "@/features/song-editor/lib/song-api";
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
  const [query, setQuery] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [renamePending, setRenamePending] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SongSummaryModel | null>(
    null,
  );
  const [deletePending, setDeletePending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (!token) {
        // Without a token the fetch never fires; surface that instead of
        // sitting on "loading" forever.
        setStatus("error");
        setError("Your session has ended. Sign in again to see your library.");

        return;
      }

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

  function beginRename(song: SongSummaryModel) {
    setRenamingId(song.id);
    setDraftTitle(song.title);
    setRenameError(null);
    setActionError(null);
  }

  function cancelRename() {
    setRenamingId(null);
    setDraftTitle("");
    setRenameError(null);
  }

  async function commitRename(song: SongSummaryModel) {
    const nextTitle = draftTitle.trim();

    if (!token || nextTitle === "" || nextTitle === song.title) {
      cancelRename();
      return;
    }

    setRenamePending(true);
    setRenameError(null);

    try {
      const response = await updateSongTitle(token, song.id, nextTitle);

      // Merge instead of remapping: the PATCH response has no section_count.
      setSongs((currentSongs) =>
        currentSongs.map((currentSong) =>
          currentSong.id === song.id
            ? {
                ...currentSong,
                title: response.title,
                updatedAt: response.updated_at ?? currentSong.updatedAt,
              }
            : currentSong,
        ),
      );
      cancelRename();
    } catch (renameFailure) {
      setRenameError(
        renameFailure instanceof Error
          ? renameFailure.message
          : "Unable to rename the sketch.",
      );
    } finally {
      setRenamePending(false);
    }
  }

  async function confirmDelete() {
    if (!token || !pendingDelete) {
      setPendingDelete(null);
      return;
    }

    const target = pendingDelete;
    setDeletePending(true);
    setActionError(null);

    try {
      await deleteSong(token, target.id);
      setSongs((currentSongs) =>
        currentSongs.filter((currentSong) => currentSong.id !== target.id),
      );
    } catch (deleteFailure) {
      setActionError(
        deleteFailure instanceof Error
          ? deleteFailure.message
          : "Unable to delete the sketch.",
      );
    } finally {
      setDeletePending(false);
      setPendingDelete(null);
    }
  }

  const normalizedQuery = query.trim().toLowerCase();
  const visibleSongs = normalizedQuery
    ? songs.filter((song) => song.title.toLowerCase().includes(normalizedQuery))
    : songs;

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={pendingDelete !== null}
        destructive
        title={pendingDelete ? `Delete "${pendingDelete.title}"?` : "Delete?"}
        message="This permanently removes the sketch, its sections, chords, and melody notes."
        confirmLabel={deletePending ? "Deleting..." : "Delete"}
        onConfirm={() => {
          if (!deletePending) {
            void confirmDelete();
          }
        }}
        onCancel={() => {
          if (!deletePending) {
            setPendingDelete(null);
          }
        }}
      />

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
              Open a saved sketch and pick up where you left off.
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
        actions={
          status === "ready" && songs.length > 0 ? (
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search sketches..."
              aria-label="Search sketches by title"
              className="w-48 rounded-full border border-highlight/80 bg-background/55 px-4 py-2 text-sm font-semibold text-foreground placeholder:text-foreground/40 focus:border-accent/40 focus:outline-none focus:ring-4 focus:ring-accent/15"
            />
          ) : undefined
        }
        bodyClassName="space-y-6"
      >
        {actionError ? (
          <div
            role="alert"
            className="rounded-[1.3rem] border border-rose-500/25 bg-rose-500/10 p-5 text-sm leading-6 text-rose-900 dark:text-rose-100"
          >
            {actionError}
          </div>
        ) : null}

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
        ) : visibleSongs.length === 0 ? (
          <div className="rounded-[1.3rem] border border-highlight/70 bg-background/55 p-5 text-sm font-semibold text-muted">
            No sketches match &ldquo;{query.trim()}&rdquo;.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleSongs.map((song) => {
              const renaming = renamingId === song.id;

              return (
                <div
                  key={song.id}
                  className="flex flex-col rounded-[1.35rem] border border-highlight/80 bg-background/45 p-5 transition hover:border-accent/30 hover:bg-background/70"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    {renaming ? (
                      <div className="min-w-0 flex-1 space-y-2">
                        <input
                          type="text"
                          value={draftTitle}
                          autoFocus
                          disabled={renamePending}
                          maxLength={200}
                          aria-label="Sketch title"
                          onChange={(event) =>
                            setDraftTitle(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              void commitRename(song);
                            } else if (event.key === "Escape") {
                              event.preventDefault();
                              cancelRename();
                            }
                          }}
                          className="w-full rounded-[0.95rem] border border-highlight/80 bg-background/55 px-3 py-2 text-base font-semibold text-foreground focus:border-accent/40 focus:outline-none focus:ring-4 focus:ring-accent/15 disabled:opacity-60"
                        />
                        {renameError ? (
                          <p role="alert" className="text-sm text-rose-500">
                            {renameError}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <Link
                        href={`/songs/${song.id}`}
                        scroll={false}
                        className="min-w-0 rounded-[0.95rem] focus:outline-none focus:ring-4 focus:ring-accent/15"
                      >
                        <p className="truncate text-lg font-semibold tracking-tight text-foreground">
                          {song.title}
                        </p>
                        <p className="mt-2 text-sm text-muted">
                          {song.masterTonalCenter}{" "}
                          {formatModeLabel(song.masterMode)}
                        </p>
                      </Link>
                    )}
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

                  <div className="mt-5 flex flex-wrap gap-2 border-t border-highlight/60 pt-4">
                    {renaming ? (
                      <>
                        <button
                          type="button"
                          disabled={renamePending}
                          onClick={() => void commitRename(song)}
                          className="rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-950 transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {renamePending ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          disabled={renamePending}
                          onClick={cancelRename}
                          className="rounded-full border border-highlight/80 bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/65 transition hover:text-foreground focus:outline-none focus:ring-4 focus:ring-accent/20 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href={`/songs/${song.id}`}
                          scroll={false}
                          className="rounded-full border border-accent/35 bg-accent-soft px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-accent/25"
                        >
                          Open
                        </Link>
                        <button
                          type="button"
                          onClick={() => beginRename(song)}
                          className="rounded-full border border-highlight/80 bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/65 transition hover:border-accent/30 hover:text-foreground focus:outline-none focus:ring-4 focus:ring-accent/20"
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActionError(null);
                            setPendingDelete(song);
                          }}
                          className="rounded-full border border-rose-500/25 bg-rose-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-950 transition hover:brightness-95 focus:outline-none focus:ring-4 focus:ring-rose-500/20 dark:text-rose-100"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PanelShell>
    </div>
  );
}
