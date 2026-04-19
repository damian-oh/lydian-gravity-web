"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

import { PanelShell } from "@/components/ui/panel-shell";
import { AudioPreviewPanel } from "@/features/audio-preview/components/audio-preview-panel";
import { TransportBar } from "@/features/audio-preview/components/transport-bar";
import { useSectionTransport } from "@/features/audio-preview/lib/use-section-transport";
import { useAppShellNavigation } from "@/components/layout/app-shell-navigation";
import { ChordPicker } from "@/features/song-editor/components/chord-picker";
import { MelodyLaneEditor } from "@/features/song-editor/components/melody-lane-editor";
import {
  buildChordCatalog,
  formatChordSourceLabel,
  formatModeLabel,
  getChordSourceKind,
  type ChordCatalogItem,
  type ChordCatalogTab,
} from "@/features/song-editor/lib/chord-catalog";
import { buildMelodyGravityMap } from "@/features/song-editor/lib/melody-gravity";
import {
  emptySectionTheory,
  type MelodicNoteModel,
  type SectionType,
  type SongChord,
  type SongSectionModel,
  type SongSketchModel,
} from "@/features/song-editor/lib/song-model";
import { TheoryPanel } from "@/features/theory/components/theory-panel";
import { cn } from "@/lib/cn";

type SongEditorWorkspaceProps = Readonly<{
  song: SongSketchModel;
  onSaveArrangement: (
    sections: readonly SongSectionModel[],
  ) => Promise<SongSketchModel>;
}>;

type TimelineBar = Readonly<{
  index: number;
  beatCount: number;
}>;

type TimelineSpec = Readonly<{
  totalBeats: number;
  beatsPerBar: number;
  barCount: number;
  bars: readonly TimelineBar[];
}>;

type ChordSlot = Readonly<{
  barIndex: number;
  startBeat: number;
  chord: SongChord | null;
}>;

type PickerState = Readonly<{
  sectionId: number;
  barIndex: number;
  defaultTab: ChordCatalogTab;
}>;

const desktopBeatMinWidthRem = 5.5;
const sectionTypes: readonly SectionType[] = ["A", "B", "C", "D"];
const barPresets = [4, 8, 16] as const;
const melodySnapBeat = 0.25;
const minimumMelodyPitch = 24;
const maximumMelodyPitch = 107;

function formatBeatWindow(startBeat: number, durationBeats: number) {
  const endBeat = startBeat + durationBeats;

  return `Beat ${startBeat + 1} to ${endBeat}`;
}

function getBeatsPerBar(timeSignature: string) {
  const [numerator] = timeSignature.split("/");
  const beatsPerBar = Number.parseInt(numerator ?? "", 10);

  if (!Number.isFinite(beatsPerBar) || beatsPerBar <= 0) {
    return 4;
  }

  return beatsPerBar;
}

function buildTimelineSpec(totalBeats: number, timeSignature: string): TimelineSpec {
  const safeTotalBeats = Math.max(1, Math.ceil(totalBeats));
  const beatsPerBar = getBeatsPerBar(timeSignature);
  const barCount = Math.ceil(safeTotalBeats / beatsPerBar);
  const bars = Array.from({ length: barCount }, (_, index) => {
    const remainingBeats = safeTotalBeats - index * beatsPerBar;

    return {
      index,
      beatCount: Math.max(1, Math.min(beatsPerBar, remainingBeats)),
    };
  });

  return {
    totalBeats: safeTotalBeats,
    beatsPerBar,
    barCount,
    bars,
  };
}

function TimelineBarHeader({
  timeline,
  columnTemplate,
  expanded = false,
}: Readonly<{
  timeline: TimelineSpec;
  columnTemplate?: string;
  expanded?: boolean;
}>) {
  return (
    <div
      className={cn(
        "mb-3 grid text-xs font-semibold uppercase tracking-[0.2em] text-foreground/45",
        expanded ? "gap-0" : "gap-2",
      )}
      style={{
        gridTemplateColumns:
          columnTemplate ?? `repeat(${timeline.totalBeats}, minmax(0, 1fr))`,
      }}
    >
      {timeline.bars.map((bar) => (
        expanded ? (
          <div
            key={bar.index}
            className="px-1.5"
            style={{
              gridColumn: `span ${bar.beatCount}`,
            }}
          >
            <div className="rounded-full border border-highlight/70 bg-background/45 px-3 py-2 text-center">
              Bar {bar.index + 1}
            </div>
          </div>
        ) : (
          <div
            key={bar.index}
            className="rounded-full border border-highlight/70 bg-background/45 px-3 py-2 text-center"
            style={{
              gridColumn: `span ${bar.beatCount}`,
            }}
          >
            Bar {bar.index + 1}
          </div>
        )
      ))}
    </div>
  );
}

function buildExpandedTimelineColumns(totalBeats: number) {
  return `repeat(${totalBeats}, minmax(${desktopBeatMinWidthRem}rem, 1fr))`;
}

function buildExpandedTimelineMinWidth(totalBeats: number) {
  return `${Math.max(totalBeats * desktopBeatMinWidthRem, 48)}rem`;
}

function formatSectionDisplayLabel(
  sectionType: SectionType,
  occurrence: number,
) {
  return occurrence === 1 ? sectionType : `${occurrence}${sectionType}`;
}

function buildSectionDisplayLabelMap(sections: readonly SongSectionModel[]) {
  const counts: Record<SectionType, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
  };

  return new Map(
    sections.map((section) => {
      counts[section.sectionType] += 1;

      return [
        section.id,
        formatSectionDisplayLabel(section.sectionType, counts[section.sectionType]),
      ];
    }),
  );
}

function getMinimumSectionBeats(section: SongSectionModel) {
  const furthestChordBeat = section.chords.reduce(
    (furthestBeat, chord) =>
      Math.max(furthestBeat, chord.startBeat + chord.durationBeats),
    0,
  );
  const furthestMelodyBeat = section.melodicNotes.reduce(
    (furthestBeat, note) =>
      Math.max(furthestBeat, note.startBeat + note.durationBeats),
    0,
  );

  return Math.max(1, Math.ceil(Math.max(furthestChordBeat, furthestMelodyBeat)));
}

function getMinimumBarCount(section: SongSectionModel, timeSignature: string) {
  return Math.max(
    1,
    Math.ceil(getMinimumSectionBeats(section) / getBeatsPerBar(timeSignature)),
  );
}

function reindexSections(sections: readonly SongSectionModel[]) {
  return sections.map((section, index) => ({
    ...section,
    orderIndex: index,
  }));
}

function getNextSectionId(sections: readonly SongSectionModel[]) {
  return sections.reduce(
    (maxSectionId, section) => Math.max(maxSectionId, section.id),
    0,
  ) + 1;
}

function getNextChordId(sections: readonly SongSectionModel[]) {
  return sections.reduce(
    (maxChordId, section) =>
      section.chords.reduce(
        (sectionMaxChordId, chord) => Math.max(sectionMaxChordId, chord.id),
        maxChordId,
      ),
    0,
  ) + 1;
}

function getNextMelodicNoteId(sections: readonly SongSectionModel[]) {
  return sections.reduce(
    (maxNoteId, section) =>
      section.melodicNotes.reduce(
        (sectionMaxNoteId, note) => Math.max(sectionMaxNoteId, note.id),
        maxNoteId,
      ),
    0,
  ) + 1;
}

function sortAndReindexChords(chords: readonly SongChord[]) {
  return [...chords]
    .sort((left, right) => left.startBeat - right.startBeat)
    .map((chord, index) => ({
      ...chord,
      orderIndex: index,
    }));
}

function roundToMelodySnap(value: number) {
  return Math.round(value / melodySnapBeat) * melodySnapBeat;
}

function sortMelodicNotes(notes: readonly MelodicNoteModel[]) {
  return [...notes].sort((left, right) =>
    left.startBeat === right.startBeat
      ? left.pitch - right.pitch
      : left.startBeat - right.startBeat,
  );
}

function clampMelodicNote(
  note: MelodicNoteModel,
  totalBeats: number,
): MelodicNoteModel {
  const safePitch = Math.min(
    maximumMelodyPitch,
    Math.max(minimumMelodyPitch, Math.round(note.pitch)),
  );
  const safeStartBeat = Math.max(
    0,
    Math.min(
      Math.max(0, totalBeats - melodySnapBeat),
      roundToMelodySnap(note.startBeat),
    ),
  );
  const safeDurationBeat = Math.max(
    melodySnapBeat,
    Math.min(
      Math.max(melodySnapBeat, totalBeats - safeStartBeat),
      roundToMelodySnap(note.durationBeats),
    ),
  );

  return {
    ...note,
    pitch: safePitch,
    startBeat: safeStartBeat,
    durationBeats: safeDurationBeat,
  };
}

function normalizeMonophonicMelody(
  notes: readonly MelodicNoteModel[],
  editedNoteId: number,
  totalBeats: number,
) {
  const clampedNotes = sortMelodicNotes(
    notes.map((note) => clampMelodicNote(note, totalBeats)),
  );
  const editedNote = clampedNotes.find((note) => note.id === editedNoteId);

  if (!editedNote) {
    return clampedNotes;
  }

  const editedNoteEndBeat = editedNote.startBeat + editedNote.durationBeats;

  return sortMelodicNotes(
    clampedNotes.flatMap((note) => {
      if (note.id === editedNoteId) {
        return [note];
      }

      const noteEndBeat = note.startBeat + note.durationBeats;

      if (
        noteEndBeat <= editedNote.startBeat ||
        note.startBeat >= editedNoteEndBeat
      ) {
        return [note];
      }

      if (note.startBeat < editedNote.startBeat) {
        const trimmedDurationBeats = roundToMelodySnap(
          editedNote.startBeat - note.startBeat,
        );

        return trimmedDurationBeats >= melodySnapBeat
          ? [{ ...note, durationBeats: trimmedDurationBeats }]
          : [];
      }

      if (noteEndBeat > editedNoteEndBeat) {
        const shiftedStartBeat = roundToMelodySnap(editedNoteEndBeat);
        const trimmedDurationBeats = roundToMelodySnap(
          noteEndBeat - shiftedStartBeat,
        );

        return trimmedDurationBeats >= melodySnapBeat
          ? [
              {
                ...note,
                startBeat: shiftedStartBeat,
                durationBeats: trimmedDurationBeats,
              },
            ]
          : [];
      }

      return [];
    }),
  );
}

function buildChordSlots(
  section: SongSectionModel,
  timeSignature: string,
): readonly ChordSlot[] {
  const beatsPerBar = getBeatsPerBar(timeSignature);
  const timeline = buildTimelineSpec(section.totalBeats, timeSignature);
  const chordByBarIndex = new Map<number, SongChord>();

  section.chords.forEach((chord) => {
    const barIndex = Math.floor(chord.startBeat / beatsPerBar);

    if (!chordByBarIndex.has(barIndex)) {
      chordByBarIndex.set(barIndex, chord);
    }
  });

  return Array.from({ length: timeline.barCount }, (_, barIndex) => ({
    barIndex,
    startBeat: barIndex * beatsPerBar,
    chord: chordByBarIndex.get(barIndex) ?? null,
  }));
}

function getChordPickerDefaultTab(
  chord: SongChord | null,
  masterMode: string,
): ChordCatalogTab {
  if (!chord || chord.parentMode === masterMode) {
    return "diatonic";
  }

  if (chord.parentMode === "secondary dominant") {
    return "secondaryDominant";
  }

  return "modalInterchange";
}

function getChordSourceBadgeClassName(parentMode: string, masterMode: string) {
  switch (getChordSourceKind(parentMode, masterMode)) {
    case "secondaryDominant":
      return "border border-sky-500/25 bg-sky-500/10 text-sky-950 dark:text-sky-100";
    case "modalInterchange":
      return "border border-amber-500/25 bg-amber-500/10 text-amber-950 dark:text-amber-100";
    default:
      return "border border-highlight/80 bg-surface text-foreground/65";
  }
}

function buildSongChordFromCatalogItem(
  item: ChordCatalogItem,
  sectionId: number,
  chordId: number,
  slot: ChordSlot,
  beatsPerBar: number,
): SongChord {
  return {
    id: chordId,
    sectionId,
    orderIndex: slot.barIndex,
    root: item.root,
    quality: item.quality,
    chordName: item.chordName,
    notes: item.notes,
    startBeat: slot.startBeat,
    durationBeats: beatsPerBar,
    parentMode: item.parentMode,
  };
}

function ChordSlotCard({
  slot,
  masterMode,
  selected,
  pickerOpen,
  onSelect,
  onOpenPicker,
  onRemove,
  className,
  style,
}: Readonly<{
  slot: ChordSlot;
  masterMode: string;
  selected: boolean;
  pickerOpen: boolean;
  onSelect: () => void;
  onOpenPicker: () => void;
  onRemove: () => void;
  className?: string;
  style?: CSSProperties;
}>) {
  if (!slot.chord) {
    return (
      <button
        type="button"
        onClick={onOpenPicker}
        className={cn(
          "flex h-full min-h-[11rem] w-full flex-col justify-between rounded-[1.3rem] border border-dashed px-4 py-4 text-left transition focus:outline-none focus:ring-4 focus:ring-accent/15",
          pickerOpen
            ? "border-accent/35 bg-accent-soft/55"
            : "border-highlight/80 bg-background/35 hover:border-accent/25 hover:bg-background/55",
          className,
        )}
        style={style}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/45">
              Bar {slot.barIndex + 1}
            </p>
            <p className="mt-3 text-lg font-semibold text-foreground">Add chord</p>
          </div>
          <span className="rounded-full border border-highlight/80 bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/65">
            Slot
          </span>
        </div>

        <p className="mt-4 text-sm leading-6 text-muted">
          Choose a diatonic, secondary-dominant, or modal-interchange color for
          this bar.
        </p>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-[1.3rem] border px-4 py-4 transition",
        selected || pickerOpen
          ? "border-accent/35 bg-accent-soft/75"
          : "border-highlight/80 bg-background/45 hover:border-accent/25 hover:bg-background/70",
        className,
      )}
      style={style}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/45">
            Bar {slot.barIndex + 1}
          </p>
          <p className="mt-3 text-xl font-semibold text-foreground">
            {slot.chord.chordName}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenPicker}
          className="rounded-full border border-highlight/80 bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/72 transition hover:border-accent/30 hover:text-foreground focus:outline-none focus:ring-4 focus:ring-accent/15"
        >
          Change
        </button>
      </div>

      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="mt-4 block w-full flex-1 text-left focus:outline-none"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
              getChordSourceBadgeClassName(slot.chord.parentMode, masterMode),
            )}
          >
            {formatChordSourceLabel(slot.chord.parentMode, masterMode)}
          </span>
          <span className="rounded-full border border-highlight/80 bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/65">
            {formatBeatWindow(slot.chord.startBeat, slot.chord.durationBeats)}
          </span>
        </div>

        <p className="mt-4 text-sm leading-6 text-muted">
          {slot.chord.notes.join(" • ")}
        </p>
      </button>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-950 transition hover:brightness-95 focus:outline-none focus:ring-4 focus:ring-rose-500/20 dark:text-rose-100"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function ChordPickerDesktopPopover({
  pickerState,
  catalog,
  currentChord,
  onClose,
  onSelect,
}: Readonly<{
  pickerState: PickerState | null;
  catalog: ReturnType<typeof buildChordCatalog>;
  currentChord: SongChord | null;
  onClose: () => void;
  onSelect: (item: ChordCatalogItem) => void;
}>) {
  if (!pickerState) {
    return null;
  }

  return (
    <div className="hidden lg:block">
      <div className="mx-auto mb-2 w-full max-w-5xl rounded-[1.5rem] border border-highlight/70 bg-background/35 p-3">
        <ChordPicker
          catalog={catalog}
          currentChord={currentChord}
          defaultTab={pickerState.defaultTab}
          slotLabel={`Bar ${pickerState.barIndex + 1}`}
          onClose={onClose}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}

function ChordPickerMobileSheet({
  pickerState,
  catalog,
  currentChord,
  onClose,
  onSelect,
}: Readonly<{
  pickerState: PickerState | null;
  catalog: ReturnType<typeof buildChordCatalog>;
  currentChord: SongChord | null;
  onClose: () => void;
  onSelect: (item: ChordCatalogItem) => void;
}>) {
  if (!pickerState) {
    return null;
  }

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="Close chord picker"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-950/35"
      />
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-hidden rounded-t-[1.8rem] border border-highlight/80 bg-background p-4 shadow-[0_-24px_60px_-32px_rgba(15,23,42,0.75)]">
        <ChordPicker
          catalog={catalog}
          currentChord={currentChord}
          defaultTab={pickerState.defaultTab}
          slotLabel={`Bar ${pickerState.barIndex + 1}`}
          onClose={onClose}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}

export function SongEditorWorkspace({
  song,
  onSaveArrangement,
}: SongEditorWorkspaceProps) {
  const [sections, setSections] = useState(song.sections);
  const [activeSectionId, setActiveSectionId] = useState(song.sections[0]?.id ?? 0);
  const [selectedChordId, setSelectedChordId] = useState<number | null>(
    song.sections[0]?.chords[0]?.id ?? null,
  );
  const [selectedMelodyNoteId, setSelectedMelodyNoteId] = useState<number | null>(
    song.sections[0]?.melodicNotes[0]?.id ?? null,
  );
  const [pickerState, setPickerState] = useState<PickerState | null>(null);
  const [mobileView, setMobileView] = useState<"progression" | "melody">(
    "progression",
  );
  const [transportScopeKey, setTransportScopeKey] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { setNavigationGuard } = useAppShellNavigation();

  useEffect(() => {
    setNavigationGuard(
      dirty
        ? {
            message: "Leave this editor and discard unsaved arrangement changes?",
          }
        : null,
    );

    return () => {
      setNavigationGuard(null);
    };
  }, [dirty, setNavigationGuard]);

  useEffect(() => {
    setPickerState(null);
  }, [activeSectionId]);

  useEffect(() => {
    if (!pickerState) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPickerState(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [pickerState]);

  const activeSection =
    sections.find((section) => section.id === activeSectionId) ?? sections[0];
  const { state: transportState, actions: transportActions } = useSectionTransport({
    scopeKey: transportScopeKey,
    sectionId: activeSection?.id ?? 0,
    totalBeats: activeSection?.totalBeats ?? 1,
    tempoBpm: song.tempoBpm,
    timeSignature: song.timeSignature,
    chords: activeSection?.chords ?? [],
    melodicNotes: activeSection?.melodicNotes ?? [],
  });

  useEffect(() => {
    if (!activeSection || selectedMelodyNoteId === null) {
      return;
    }

    if (
      !activeSection.melodicNotes.some((note) => note.id === selectedMelodyNoteId)
    ) {
      setSelectedMelodyNoteId(null);
    }
  }, [activeSection, selectedMelodyNoteId]);

  if (!activeSection) {
    return null;
  }

  const sectionDisplayLabels = buildSectionDisplayLabelMap(sections);
  const activeSectionLabel =
    sectionDisplayLabels.get(activeSection.id) ?? activeSection.sectionType;
  const selectedChord =
    activeSection.chords.find((chord) => chord.id === selectedChordId) ??
    activeSection.chords[0] ??
    null;
  const activeTimeline = buildTimelineSpec(
    activeSection.totalBeats,
    song.timeSignature,
  );
  const desktopTimelineColumns = buildExpandedTimelineColumns(
    activeTimeline.totalBeats,
  );
  const desktopTimelineMinWidth = buildExpandedTimelineMinWidth(
    activeTimeline.totalBeats,
  );
  const activeChordSlots = buildChordSlots(activeSection, song.timeSignature);
  const melodyGravityByNoteId = buildMelodyGravityMap(
    activeSection.melodicNotes,
    activeSection.chords,
    song.masterTonalCenter,
    song.masterMode,
  );
  const chordCatalog = buildChordCatalog(song.masterTonalCenter, song.masterMode);
  const parsedSongId = Number.parseInt(song.id, 10);
  const songSketchId =
    sections[0]?.songSketchId ?? (Number.isFinite(parsedSongId) ? parsedSongId : 1);
  const pickerSlot =
    pickerState?.sectionId === activeSection.id
      ? activeChordSlots.find((slot) => slot.barIndex === pickerState.barIndex) ?? null
      : null;
  const pickerChord = pickerSlot?.chord ?? null;

  function markArrangementDirty() {
    setDirty(true);
    setSaveMessage(null);
    setSaveError(null);
  }

  async function handleSaveArrangement() {
    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const savedSong = await onSaveArrangement(sections);
      setSections(savedSong.sections);
      setActiveSectionId((currentActiveSectionId) =>
        savedSong.sections.some((section) => section.id === currentActiveSectionId)
          ? currentActiveSectionId
          : savedSong.sections[0]?.id ?? 0,
      );
      setDirty(false);
      setSaveMessage("Arrangement saved.");
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Unable to save the arrangement.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleActivateSection(nextSection: SongSectionModel) {
    if (nextSection.id !== activeSectionId) {
      setTransportScopeKey((current) => current + 1);
    }

    setActiveSectionId(nextSection.id);
    setSelectedChordId(nextSection.chords[0]?.id ?? null);
    setSelectedMelodyNoteId(nextSection.melodicNotes[0]?.id ?? null);
  }

  function handleSectionTypeChange(sectionId: number, sectionType: SectionType) {
    markArrangementDirty();
    setSections((currentSections) =>
      reindexSections(
        currentSections.map((section) =>
          section.id === sectionId ? { ...section, sectionType } : section,
        ),
      ),
    );
  }

  function handleBarCountChange(sectionId: number, nextBarCount: number) {
    markArrangementDirty();
    setSections((currentSections) =>
      reindexSections(
        currentSections.map((section) => {
          if (section.id !== sectionId) {
            return section;
          }

          const minimumBarCount = getMinimumBarCount(section, song.timeSignature);
          const safeBarCount = Math.max(
            minimumBarCount,
            Number.isFinite(nextBarCount) ? Math.floor(nextBarCount) : minimumBarCount,
          );

          return {
            ...section,
            totalBeats: safeBarCount * getBeatsPerBar(song.timeSignature),
          };
        }),
      ),
    );
  }

  function handleRemoveSection(sectionId: number) {
    if (sections.length === 1) {
      return;
    }

    const sectionIndex = sections.findIndex((section) => section.id === sectionId);

    if (sectionIndex < 0) {
      return;
    }

    const nextSections = reindexSections(
      sections.filter((section) => section.id !== sectionId),
    );

    markArrangementDirty();
    setSections(nextSections);

    if (activeSectionId !== sectionId) {
      return;
    }

    const nextActiveSection =
      nextSections[sectionIndex] ?? nextSections[sectionIndex - 1] ?? nextSections[0];

    handleActivateSection(nextActiveSection);
  }

  function handleAddSection(sectionType: SectionType) {
    markArrangementDirty();
    setSections((currentSections) => {
      const nextSectionId = getNextSectionId(currentSections);
      const nextSection: SongSectionModel = {
        id: nextSectionId,
        songSketchId: currentSections[0]?.songSketchId ?? songSketchId,
        sectionType,
        label: sectionType,
        orderIndex: currentSections.length,
        totalBeats: 4 * getBeatsPerBar(song.timeSignature),
        chords: [],
        melodicNotes: [],
        theory: emptySectionTheory,
      };

      return reindexSections([...currentSections, nextSection]);
    });
  }

  function openChordPicker(
    slot: ChordSlot,
    defaultTab: ChordCatalogTab,
  ) {
    if (slot.chord) {
      setSelectedChordId(slot.chord.id);
    }

    setPickerState({
      sectionId: activeSection.id,
      barIndex: slot.barIndex,
      defaultTab,
    });
  }

  function handleOpenChordPicker(
    slot: ChordSlot,
    defaultTab = getChordPickerDefaultTab(slot.chord, song.masterMode),
  ) {
    openChordPicker(slot, defaultTab);
  }

  function handleSelectChordCatalogItem(item: ChordCatalogItem) {
    if (!pickerState) {
      return;
    }

    markArrangementDirty();
    const targetSectionId = pickerState.sectionId;
    const targetBarIndex = pickerState.barIndex;
    const beatsPerBar = getBeatsPerBar(song.timeSignature);
    let nextSelectedChordId: number | null = null;

    setSections((currentSections) =>
      reindexSections(
        currentSections.map((section) => {
          if (section.id !== targetSectionId) {
            return section;
          }

          const slot = buildChordSlots(section, song.timeSignature).find(
            (sectionSlot) => sectionSlot.barIndex === targetBarIndex,
          );

          if (!slot) {
            return section;
          }

          const nextChordId = getNextChordId(currentSections);
          const remainingChords = section.chords.filter(
            (chord) => Math.floor(chord.startBeat / beatsPerBar) !== targetBarIndex,
          );
          const nextChord = buildSongChordFromCatalogItem(
            item,
            section.id,
            nextChordId,
            slot,
            beatsPerBar,
          );

          nextSelectedChordId = nextChord.id;

          return {
            ...section,
            chords: sortAndReindexChords([...remainingChords, nextChord]),
          };
        }),
      ),
    );

    setSelectedChordId(nextSelectedChordId);
    setPickerState(null);
  }

  function handleRemoveChord(chordId: number) {
    let nextSelectedChordId: number | null = null;

    markArrangementDirty();
    setSections((currentSections) =>
      reindexSections(
        currentSections.map((section) => {
          if (section.id !== activeSection.id) {
            return section;
          }

          const remainingChords = sortAndReindexChords(
            section.chords.filter((chord) => chord.id !== chordId),
          );

          nextSelectedChordId =
            selectedChordId === chordId
              ? remainingChords[0]?.id ?? null
              : selectedChordId;

          return {
            ...section,
            chords: remainingChords,
          };
        }),
      ),
    );

    setSelectedChordId(nextSelectedChordId);
    setPickerState(null);
  }

  function handleAddMelodyNote(
    draft: Pick<MelodicNoteModel, "pitch" | "startBeat" | "durationBeats">,
  ) {
    let nextSelectedMelodyNoteId: number | null = null;

    markArrangementDirty();
    setSections((currentSections) =>
      reindexSections(
        currentSections.map((section) => {
          if (section.id !== activeSection.id) {
            return section;
          }

          const nextNoteId = getNextMelodicNoteId(currentSections);
          const nextNote = clampMelodicNote(
            {
              id: nextNoteId,
              sectionId: section.id,
              ...draft,
            },
            section.totalBeats,
          );

          nextSelectedMelodyNoteId = nextNote.id;

          return {
            ...section,
            melodicNotes: normalizeMonophonicMelody(
              [...section.melodicNotes, nextNote],
              nextNote.id,
              section.totalBeats,
            ),
          };
        }),
      ),
    );

    setSelectedMelodyNoteId(nextSelectedMelodyNoteId);
  }

  function handleUpdateMelodyNote(
    noteId: number,
    next: Pick<MelodicNoteModel, "pitch" | "startBeat" | "durationBeats">,
  ) {
    markArrangementDirty();
    setSections((currentSections) =>
      reindexSections(
        currentSections.map((section) => {
          if (section.id !== activeSection.id) {
            return section;
          }

          const existingNote = section.melodicNotes.find((note) => note.id === noteId);

          if (!existingNote) {
            return section;
          }

          const updatedNote = clampMelodicNote(
            {
              ...existingNote,
              ...next,
            },
            section.totalBeats,
          );

          return {
            ...section,
            melodicNotes: normalizeMonophonicMelody(
              section.melodicNotes.map((note) =>
                note.id === noteId ? updatedNote : note,
              ),
              noteId,
              section.totalBeats,
            ),
          };
        }),
      ),
    );

    setSelectedMelodyNoteId(noteId);
  }

  function handleRemoveMelodyNote(noteId: number) {
    const nextSelectedMelodyNoteId =
      selectedMelodyNoteId === noteId ? null : selectedMelodyNoteId;

    markArrangementDirty();
    setSections((currentSections) =>
      reindexSections(
        currentSections.map((section) => {
          if (section.id !== activeSection.id) {
            return section;
          }

          return {
            ...section,
            melodicNotes: sortMelodicNotes(
              section.melodicNotes.filter((note) => note.id !== noteId),
            ),
          };
        }),
      ),
    );

    setSelectedMelodyNoteId(nextSelectedMelodyNoteId);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
            Guided Melody & Chord Sketch Editor
          </p>
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {song.title}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted sm:text-lg">
              Shape sections, chord placement, melody notes, modal-interchange
              cues, and preview controls in one workspace.
            </p>
          </div>
        </div>

        <div className="flex max-w-xl flex-wrap justify-end gap-2">
          <div className="flex flex-wrap justify-end gap-2">
            {[
              `${song.masterTonalCenter} ${formatModeLabel(song.masterMode)}`,
              `${song.tempoBpm} BPM`,
              song.timeSignature,
              `${sections.length} sections`,
              dirty ? "Unsaved" : "Saved",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-highlight/80 bg-surface px-3 py-2 text-sm font-semibold text-foreground/72"
              >
                {item}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void handleSaveArrangement()}
            disabled={!dirty || isSaving}
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </header>

      {saveMessage || saveError ? (
        <div
          role={saveError ? "alert" : "status"}
          className={cn(
            "rounded-[1.1rem] border px-4 py-3 text-sm font-semibold",
            saveError
              ? "border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-100"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100",
          )}
        >
          {saveError ?? saveMessage}
        </div>
      ) : null}

      <PanelShell
        eyebrow="Structure Builder"
        title="Define the section flow"
        description="Set the sequence and bar count for each section before refining the harmony and melody lanes."
        bodyClassName="space-y-4"
      >
        <div className="-mx-1 overflow-x-auto px-1 pb-2">
          <div className="flex gap-4">
            {sections.map((section, index) => {
              const sectionTimeline = buildTimelineSpec(
                section.totalBeats,
                song.timeSignature,
              );
              const sectionDisplayLabel =
                sectionDisplayLabels.get(section.id) ?? section.sectionType;
              const minimumBarCount = getMinimumBarCount(
                section,
                song.timeSignature,
              );

              return (
                <div
                  key={section.id}
                  className="w-[17rem] shrink-0 rounded-[1.35rem] border border-highlight/70 bg-background/50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/45">
                        Section {index + 1}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-highlight/80 bg-surface px-3 py-1 text-sm font-semibold text-foreground">
                          {sectionDisplayLabel}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSection(section.id)}
                      disabled={sections.length === 1}
                      className="rounded-full border border-highlight/80 bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/72 transition hover:border-accent/30 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/45">
                        Base Section Type
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {sectionTypes.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleSectionTypeChange(section.id, option)}
                            className={cn(
                              "rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-accent/15",
                              section.sectionType === option
                                ? "border-accent/35 bg-accent-soft text-foreground"
                                : "border-highlight/80 bg-surface text-foreground/72 hover:border-accent/25 hover:text-foreground",
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/45">
                          Bars
                        </p>
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/45">
                          Min {minimumBarCount}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleBarCountChange(
                              section.id,
                              sectionTimeline.barCount - 1,
                            )
                          }
                          disabled={sectionTimeline.barCount <= minimumBarCount}
                          className="rounded-full border border-highlight/80 bg-surface px-3 py-2 text-sm font-semibold text-foreground/72 transition hover:border-accent/30 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={minimumBarCount}
                          value={sectionTimeline.barCount}
                          onChange={(event) =>
                            handleBarCountChange(
                              section.id,
                              Number(event.currentTarget.value),
                            )
                          }
                          className="w-20 rounded-[1rem] border border-highlight/80 bg-background/55 px-3 py-2 text-center text-base font-semibold text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleBarCountChange(
                              section.id,
                              sectionTimeline.barCount + 1,
                            )
                          }
                          className="rounded-full border border-highlight/80 bg-surface px-3 py-2 text-sm font-semibold text-foreground/72 transition hover:border-accent/30 hover:text-foreground"
                        >
                          +
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {barPresets.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() =>
                              handleBarCountChange(
                                section.id,
                                Math.max(preset, minimumBarCount),
                              )
                            }
                            className={cn(
                              "rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition focus:outline-none focus:ring-4 focus:ring-accent/15",
                              sectionTimeline.barCount === preset
                                ? "border-accent/35 bg-accent-soft text-foreground"
                                : "border-highlight/80 bg-surface text-foreground/72 hover:border-accent/25 hover:text-foreground",
                            )}
                          >
                            {preset} bars
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[1.35rem] border border-dashed border-highlight bg-background/35 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/45">
            Add Section
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sectionTypes.map((sectionType) => (
              <button
                key={sectionType}
                type="button"
                onClick={() => handleAddSection(sectionType)}
                className="rounded-full border border-highlight/80 bg-surface px-4 py-2 text-sm font-semibold text-foreground/72 transition hover:border-accent/30 hover:text-foreground focus:outline-none focus:ring-4 focus:ring-accent/15"
              >
                Add {sectionType}
              </button>
            ))}
          </div>
        </div>
      </PanelShell>

      <PanelShell
        eyebrow="Section Map"
        title="Song structure"
        description="Move between sections and review the arrangement at a glance."
        bodyClassName="space-y-5"
      >
        <div className="flex gap-3 overflow-x-auto pb-2">
          {sections.map((section) => {
            const sectionTimeline = buildTimelineSpec(
              section.totalBeats,
              song.timeSignature,
            );
            const isActive = section.id === activeSection.id;
            const sectionDisplayLabel =
              sectionDisplayLabels.get(section.id) ?? section.sectionType;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => handleActivateSection(section)}
                className={cn(
                  "min-w-[13rem] rounded-[1.35rem] border px-4 py-4 text-left transition focus:outline-none focus:ring-4 focus:ring-accent/15",
                  isActive
                    ? "border-accent/35 bg-accent-soft/75"
                    : "border-highlight/80 bg-background/45 hover:border-accent/25 hover:bg-background/70",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/65">
                    {section.sectionType}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/45">
                    {sectionTimeline.barCount} bars
                  </span>
                </div>

                <p className="mt-4 text-lg font-semibold text-foreground">
                  {sectionDisplayLabel}
                </p>
              </button>
            );
          })}
        </div>

      </PanelShell>

      <div className="space-y-6">
        <TransportBar
          sectionLabel={activeSectionLabel}
          tempoBpm={song.tempoBpm}
          timeSignature={song.timeSignature}
          transport={transportState}
          actions={transportActions}
        />

        <div className="flex gap-2 lg:hidden">
          {[
            { key: "progression", label: "Progression" },
            { key: "melody", label: "Melody" },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() =>
                setMobileView(option.key as "progression" | "melody")
              }
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-accent/15",
                mobileView === option.key
                  ? "border-accent/35 bg-accent-soft text-foreground"
                  : "border-highlight/80 bg-surface text-foreground/72",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <PanelShell
          eyebrow="Harmony Lane"
          title="Chord progression"
          description="Follow the section timeline left to right and compare beat span, note spellings, and source mode."
          className={cn(
            mobileView === "progression" ? "block" : "hidden",
            "lg:block",
          )}
          bodyClassName="space-y-5"
        >
          <ChordPickerDesktopPopover
            pickerState={pickerState}
            catalog={chordCatalog}
            currentChord={pickerChord}
            onClose={() => setPickerState(null)}
            onSelect={handleSelectChordCatalogItem}
          />

          <div className="space-y-4 lg:hidden">
            <TimelineBarHeader timeline={activeTimeline} />

            <div className="grid gap-3 md:grid-cols-2">
              {activeChordSlots.map((slot) => (
                <ChordSlotCard
                  key={slot.barIndex}
                  slot={slot}
                  masterMode={song.masterMode}
                  selected={slot.chord?.id === selectedChord?.id}
                  pickerOpen={
                    pickerState?.sectionId === activeSection.id &&
                    pickerState.barIndex === slot.barIndex
                  }
                  onSelect={() => {
                    if (slot.chord) {
                      setSelectedChordId(slot.chord.id);
                    }
                  }}
                  onOpenPicker={() => handleOpenChordPicker(slot)}
                  onRemove={() => {
                    if (slot.chord) {
                      handleRemoveChord(slot.chord.id);
                    }
                  }}
                />
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="-mx-1 overflow-x-auto px-1 pb-2">
              <div className="space-y-4" style={{ minWidth: desktopTimelineMinWidth }}>
                <TimelineBarHeader
                  timeline={activeTimeline}
                  columnTemplate={desktopTimelineColumns}
                  expanded
                />

                <div className="relative overflow-hidden rounded-[1.4rem] border border-highlight/70 bg-background/45">
                  <div
                    className="pointer-events-none absolute inset-0 grid"
                    style={{
                      gridTemplateColumns: desktopTimelineColumns,
                    }}
                  >
                    {Array.from(
                      { length: activeTimeline.totalBeats },
                      (_, index) => (
                        <div
                          key={index}
                          className={cn(
                            "border-r border-highlight/50",
                            (index + 1) % activeTimeline.beatsPerBar === 0 ||
                              index === activeTimeline.totalBeats - 1
                              ? "bg-accent/5"
                              : "bg-transparent",
                          )}
                        />
                      ),
                    )}
                  </div>

                  <div
                    className="relative grid auto-rows-fr"
                    style={{
                      gridTemplateColumns: desktopTimelineColumns,
                    }}
                  >
                    {activeChordSlots.map((slot) => (
                      <div
                        key={slot.barIndex}
                        className="p-1.5"
                        style={{
                          gridColumn: `${slot.startBeat + 1} / span ${activeTimeline.beatsPerBar}`,
                        }}
                      >
                        <ChordSlotCard
                          slot={slot}
                          masterMode={song.masterMode}
                          selected={slot.chord?.id === selectedChord?.id}
                          pickerOpen={
                            pickerState?.sectionId === activeSection.id &&
                            pickerState.barIndex === slot.barIndex
                          }
                          onSelect={() => {
                            if (slot.chord) {
                              setSelectedChordId(slot.chord.id);
                            }
                          }}
                          onOpenPicker={() => handleOpenChordPicker(slot)}
                          onRemove={() => {
                            if (slot.chord) {
                              handleRemoveChord(slot.chord.id);
                            }
                          }}
                          className="h-full min-h-[11rem]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ChordPickerMobileSheet
            pickerState={pickerState}
            catalog={chordCatalog}
            currentChord={pickerChord}
            onClose={() => setPickerState(null)}
            onSelect={handleSelectChordCatalogItem}
          />
        </PanelShell>

        <PanelShell
          eyebrow="Melody Lane"
          title="Melodic note sketch"
          description="Draw, move, resize, and remove quarter-beat notes while reading their gravity against the active harmony."
          className={cn(mobileView === "melody" ? "block" : "hidden", "lg:block")}
          bodyClassName="space-y-5"
        >
          <MelodyLaneEditor
            sectionId={activeSection.id}
            timeline={activeTimeline}
            melodicNotes={activeSection.melodicNotes}
            chordSlots={activeChordSlots}
            selectedNoteId={selectedMelodyNoteId}
            gravityByNoteId={melodyGravityByNoteId}
            onSelectNote={setSelectedMelodyNoteId}
            onAddNote={handleAddMelodyNote}
            onUpdateNote={handleUpdateMelodyNote}
            onRemoveNote={handleRemoveMelodyNote}
          />
        </PanelShell>

        <div className="grid gap-6 xl:grid-cols-2">
          <TheoryPanel
            key={activeSection.id}
            song={song}
            masterMode={song.masterMode}
            section={activeSection}
            sectionLabel={activeSectionLabel}
            selectedChord={selectedChord}
            selectedNoteId={selectedMelodyNoteId}
          />
          <AudioPreviewPanel
            waveform={transportState.waveform}
            masterLevel={transportState.masterLevel}
            onWaveformChange={transportActions.setWaveform}
            onMasterLevelChange={transportActions.setMasterLevel}
          />
        </div>
      </div>
    </div>
  );
}
