"use client";

import { useState } from "react";

import { PanelShell } from "@/components/ui/panel-shell";
import {
  formatChordSourceLabel,
  getChordSourceKind,
} from "@/features/song-editor/lib/chord-catalog";
import type {
  SongChord,
  SongSectionModel,
} from "@/features/song-editor/lib/mock-song-data";
import { cn } from "@/lib/cn";

const suggestionToneClassName = {
  grounded: "border-emerald-500/25 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100",
  lift: "border-sky-500/25 bg-sky-500/10 text-sky-950 dark:text-sky-100",
  borrowed: "border-amber-500/25 bg-amber-500/12 text-amber-950 dark:text-amber-100",
  release: "border-violet-500/25 bg-violet-500/10 text-violet-950 dark:text-violet-100",
} as const;

type TheoryPanelProps = Readonly<{
  masterMode: string;
  section: SongSectionModel;
  sectionLabel: string;
  selectedChord: SongChord | null;
}>;

export function TheoryPanel({
  masterMode,
  section,
  sectionLabel,
  selectedChord,
}: TheoryPanelProps) {
  const [activeSuggestionId, setActiveSuggestionId] = useState(
    section.theory.suggestedChords[0]?.id ?? "",
  );

  const activeSuggestion =
    section.theory.suggestedChords.find(
      (suggestion) => suggestion.id === activeSuggestionId,
    ) ?? section.theory.suggestedChords[0];

  return (
    <PanelShell
      eyebrow="Theory Panel"
      title={`${sectionLabel} harmonic cues`}
      description="Review the selected chord plus chord and melody suggestions for the active section."
      bodyClassName="space-y-5"
    >
      <div className="rounded-[1.35rem] border border-highlight/70 bg-background/55 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/45">
            Selected Chord
          </p>
        </div>

        {selectedChord ? (
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xl font-semibold text-foreground">
                {selectedChord.chordName}
              </p>
              <p className="mt-1 text-sm text-muted">
                Notes: {selectedChord.notes.join(" • ")}
              </p>
            </div>

            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
                getChordSourceKind(selectedChord.parentMode, masterMode) === "diatonic"
                  ? "border border-highlight/80 bg-surface text-foreground/72"
                  : getChordSourceKind(selectedChord.parentMode, masterMode) ===
                      "secondaryDominant"
                    ? "border border-sky-500/25 bg-sky-500/10 text-sky-950 dark:text-sky-100"
                    : "border border-amber-500/25 bg-amber-500/10 text-amber-950 dark:text-amber-100",
              )}
            >
              {formatChordSourceLabel(selectedChord.parentMode, masterMode)}
            </span>
          </div>
        ) : (
          <p className="mt-3 text-sm leading-6 text-muted">
            Select a chord in the harmony lane to see its notes and source context.
          </p>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/45">
          Chord Suggestions
        </p>
        {section.theory.suggestedChords.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-2">
              {section.theory.suggestedChords.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => setActiveSuggestionId(suggestion.id)}
                  className={cn(
                    "rounded-full border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-accent/15",
                    activeSuggestionId === suggestion.id
                      ? suggestionToneClassName[suggestion.tension]
                      : "border-highlight/80 bg-surface text-foreground/72 hover:border-accent/25 hover:text-foreground",
                  )}
                >
                  {suggestion.chordName}
                </button>
              ))}
            </div>

            {activeSuggestion ? (
              <div
                className={cn(
                  "rounded-[1.3rem] border p-4",
                  suggestionToneClassName[activeSuggestion.tension],
                )}
              >
                <p className="text-sm font-semibold">{activeSuggestion.chordName}</p>
                <p className="mt-2 text-sm leading-6">{activeSuggestion.reason}</p>
              </div>
            ) : null}
          </>
        ) : (
          <div className="rounded-[1.3rem] border border-highlight/70 bg-background/55 p-4">
            <p className="text-sm leading-6 text-muted">
              Add more harmonic context to surface next-move suggestions for this
              section.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/45">
          Melody Suggestions
        </p>
        {section.theory.melodyPrompt ? (
          <div className="rounded-[1.2rem] border border-highlight/70 bg-background/55 p-4">
            <p className="text-sm leading-6 text-muted">
              {section.theory.melodyPrompt}
            </p>
          </div>
        ) : (
          <div className="rounded-[1.2rem] border border-highlight/70 bg-background/55 p-4">
            <p className="text-sm leading-6 text-muted">
              Add melodic context to surface suggestions for this section.
            </p>
          </div>
        )}
      </div>
    </PanelShell>
  );
}
