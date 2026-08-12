"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAppShellNavigation } from "@/components/layout/app-shell-navigation";
import { PanelShell } from "@/components/ui/panel-shell";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { createSong } from "@/features/song-editor/lib/song-api";

type SetupDraft = {
  title: string;
  masterTonalCenter: string;
  masterMode: string;
  tempoBpm: number;
  timeSignature: string;
  notes: string;
};

const tonalCenters = [
  "C",
  "C#",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

const modes = [
  "lydian",
  "ionian",
  "dorian",
  "mixolydian",
  "aeolian",
  "phrygian",
  "locrian",
];

const timeSignatures = ["4/4", "6/8", "3/4", "5/4", "7/8"];

const initialDraft: SetupDraft = {
  title: "Untitled Sketch",
  masterTonalCenter: "C",
  masterMode: "lydian",
  tempoBpm: 112,
  timeSignature: "4/4",
  notes: "",
};

const inputClassName =
  "w-full rounded-[1.1rem] border border-highlight/80 bg-background/55 px-4 py-3 text-base text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15";
const discardDraftMessage =
  "Leave this page and discard the changes to this sketch draft?";

function formatModeLabel(mode: string) {
  return `${mode.charAt(0).toUpperCase()}${mode.slice(1)}`;
}

function isDraftDirty(draft: SetupDraft) {
  return (
    draft.title !== initialDraft.title ||
    draft.masterTonalCenter !== initialDraft.masterTonalCenter ||
    draft.masterMode !== initialDraft.masterMode ||
    draft.tempoBpm !== initialDraft.tempoBpm ||
    draft.timeSignature !== initialDraft.timeSignature ||
    draft.notes !== initialDraft.notes
  );
}

function FieldLabel({
  label,
  hint,
}: Readonly<{ label: string; hint?: string }>) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <label className="text-sm font-medium text-foreground/80">{label}</label>
      {hint ? (
        <span className="text-xs font-medium uppercase tracking-[0.22em] text-foreground/45">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function SongSetupForm() {
  const router = useRouter();
  const { token } = useAuth();
  const [draft, setDraft] = useState(initialDraft);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { confirmNavigation, setNavigationGuard } = useAppShellNavigation();
  const draftIsDirty = isDraftDirty(draft);

  useEffect(() => {
    setNavigationGuard(
      draftIsDirty
        ? {
            message: discardDraftMessage,
          }
        : null,
    );

    return () => {
      setNavigationGuard(null);
    };
  }, [draftIsDirty, setNavigationGuard]);

  async function handleCreateSketch() {
    if (!token || isSubmitting) {
      return;
    }

    const title = draft.title.trim();
    if (!title) {
      setSubmitError("Title is required.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const song = await createSong(token, {
        ...draft,
        title,
      });
      setNavigationGuard(null);
      router.push(`/songs/${song.id}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to create the sketch.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <PanelShell
        eyebrow="Song Sketch Setup"
        title="Set the tonal identity first"
        description="Set the title, tonal center, mode, tempo, and notes before moving into the editor."
        bodyClassName="space-y-5"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldLabel label="Title" hint="Required" />
            <input
              className={inputClassName}
              value={draft.title}
              onChange={(event) => {
                const nextTitle = event.currentTarget.value;

                setDraft((current) => ({
                  ...current,
                  title: nextTitle,
                }));
              }}
              placeholder="Name the sketch"
            />
          </div>

          <div>
            <FieldLabel label="Master tonal center" />
            <select
              className={inputClassName}
              value={draft.masterTonalCenter}
              onChange={(event) => {
                const nextTonalCenter = event.currentTarget.value;

                setDraft((current) => ({
                  ...current,
                  masterTonalCenter: nextTonalCenter,
                }));
              }}
            >
              {tonalCenters.map((tonalCenter) => (
                <option key={tonalCenter} value={tonalCenter}>
                  {tonalCenter}
                </option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel label="Mode" />
            <select
              className={inputClassName}
              value={draft.masterMode}
              onChange={(event) => {
                const nextMode = event.currentTarget.value;

                setDraft((current) => ({
                  ...current,
                  masterMode: nextMode,
                }));
              }}
            >
              {modes.map((mode) => (
                <option key={mode} value={mode}>
                  {formatModeLabel(mode)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel label="Tempo" hint="20-300 BPM" />
            <input
              className={inputClassName}
              type="number"
              min={20}
              max={300}
              value={draft.tempoBpm}
              onChange={(event) => {
                const raw = event.currentTarget.value;
                const nextTempoBpm = Number(raw);

                // Number("") is 0: a cleared field mid-retype must not
                // collapse the tempo to the fallback.
                if (raw.trim() === "" || !Number.isFinite(nextTempoBpm)) {
                  return;
                }

                setDraft((current) => ({
                  ...current,
                  tempoBpm: nextTempoBpm,
                }));
              }}
            />
          </div>

          <div>
            <FieldLabel label="Time signature" />
            <select
              className={inputClassName}
              value={draft.timeSignature}
              onChange={(event) => {
                const nextTimeSignature = event.currentTarget.value;

                setDraft((current) => ({
                  ...current,
                  timeSignature: nextTimeSignature,
                }));
              }}
            >
              {timeSignatures.map((timeSignature) => (
                <option key={timeSignature} value={timeSignature}>
                  {timeSignature}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <FieldLabel label="Notes / lyrics" hint="Optional" />
          <textarea
            className={`${inputClassName} min-h-40 resize-y`}
            value={draft.notes}
            onChange={(event) => {
              const nextNotes = event.currentTarget.value;

              setDraft((current) => ({
                ...current,
                notes: nextNotes,
              }));
            }}
            placeholder="Capture lyrical ideas, arrangement notes, or harmonic targets."
          />
        </div>

        {submitError ? (
          <div
            role="alert"
            className="rounded-[1rem] border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-900 dark:text-rose-100"
          >
            {submitError}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleCreateSketch()}
            disabled={isSubmitting}
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Sketch"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirmNavigation("/library")) {
                router.push("/library");
              }
            }}
            className="rounded-full border border-highlight/80 bg-surface px-5 py-3 text-sm font-semibold text-foreground/72 transition hover:border-accent/30 hover:text-foreground focus:outline-none focus:ring-4 focus:ring-accent/20"
          >
            Back to Library
          </button>
        </div>
      </PanelShell>
    </div>
  );
}
