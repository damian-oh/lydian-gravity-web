"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import {
  midiToNoteName,
  midiToPitchClass,
  pitchClassOptions,
  type MelodyGravityResult,
} from "@/features/song-editor/lib/melody-gravity";
import type {
  MelodicNoteModel,
  SongChord,
} from "@/features/song-editor/lib/song-model";
import { cn } from "@/lib/cn";

type TimelineBar = Readonly<{
  index: number;
  beatCount: number;
}>;

type MelodyTimeline = Readonly<{
  totalBeats: number;
  beatsPerBar: number;
  barCount: number;
  bars: readonly TimelineBar[];
}>;

type MelodyChordSlot = Readonly<{
  barIndex: number;
  startBeat: number;
  chord: SongChord | null;
}>;

type MelodyLaneEditorProps = Readonly<{
  sectionId: number;
  timeline: MelodyTimeline;
  melodicNotes: readonly MelodicNoteModel[];
  chordSlots: readonly MelodyChordSlot[];
  selectedNoteId: number | null;
  gravityByNoteId: ReadonlyMap<number, MelodyGravityResult>;
  onSelectNote: (noteId: number | null) => void;
  onAddNote: (draft: Pick<MelodicNoteModel, "pitch" | "startBeat" | "durationBeats">) => void;
  onUpdateNote: (
    noteId: number,
    next: Pick<MelodicNoteModel, "pitch" | "startBeat" | "durationBeats">,
  ) => void;
  onRemoveNote: (noteId: number) => void;
}>;

type DrawGesture = Readonly<{
  kind: "draw";
  pitch: number;
  startCell: number;
  currentCell: number;
}>;

type MoveGesture = Readonly<{
  kind: "move";
  noteId: number;
  pitch: number;
  durationCells: number;
  anchorCellOffset: number;
  anchorPitch: number;
  currentStartCell: number;
  currentPitch: number;
}>;

type ResizeStartGesture = Readonly<{
  kind: "resizeStart";
  noteId: number;
  pitch: number;
  endCell: number;
  currentStartCell: number;
}>;

type ResizeEndGesture = Readonly<{
  kind: "resizeEnd";
  noteId: number;
  pitch: number;
  startCell: number;
  currentDurationCells: number;
}>;

type MelodyGesture = DrawGesture | MoveGesture | ResizeStartGesture | ResizeEndGesture;

const minPitch = 24;
const maxPitch = 107;
const pitchCount = maxPitch - minPitch + 1;
const rowHeight = 28;
const headerHeight = 52;
const snapDivisionsPerBeat = 4;
const beatWidthLevels = [56, 72, 88] as const;

const gravityToneClassName = {
  anchor:
    "border-emerald-500/35 bg-emerald-500/18 text-emerald-950 dark:text-emerald-100",
  stable:
    "border-sky-500/35 bg-sky-500/16 text-sky-950 dark:text-sky-100",
  color:
    "border-amber-500/35 bg-amber-500/16 text-amber-950 dark:text-amber-100",
  tension:
    "border-orange-500/35 bg-orange-500/16 text-orange-950 dark:text-orange-100",
  outside:
    "border-rose-500/35 bg-rose-500/16 text-rose-950 dark:text-rose-100",
} as const;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function cellToBeat(cell: number) {
  return cell / snapDivisionsPerBeat;
}

function beatToCell(beat: number) {
  return Math.round(beat * snapDivisionsPerBeat);
}

function formatBeatValue(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(2).replace(/0$/, "");
}

function isBlackKey(pitch: number) {
  return new Set([1, 3, 6, 8, 10]).has(((pitch % 12) + 12) % 12);
}

function getPitchTop(pitch: number) {
  return (maxPitch - pitch) * rowHeight;
}

function getNoteFrame(note: Pick<MelodicNoteModel, "pitch" | "startBeat" | "durationBeats">) {
  return {
    startCell: beatToCell(note.startBeat),
    durationCells: Math.max(1, beatToCell(note.durationBeats)),
    pitch: note.pitch,
  };
}

export function MelodyLaneEditor({
  sectionId,
  timeline,
  melodicNotes,
  chordSlots,
  selectedNoteId,
  gravityByNoteId,
  onSelectNote,
  onAddNote,
  onUpdateNote,
  onRemoveNote,
}: MelodyLaneEditorProps) {
  const [interactionMode, setInteractionMode] = useState<"draw" | "select">("draw");
  const [zoomIndex, setZoomIndex] = useState(1);
  const [scrollTop, setScrollTop] = useState(0);
  const [gesture, setGesture] = useState<MelodyGesture | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const gridBodyRef = useRef<HTMLDivElement | null>(null);

  const beatWidth = beatWidthLevels[zoomIndex];
  const subdivisionWidth = beatWidth / snapDivisionsPerBeat;
  const totalCells = timeline.totalBeats * snapDivisionsPerBeat;
  const gridWidth = totalCells * subdivisionWidth;
  const gridHeight = pitchCount * rowHeight;
  const selectedNote =
    melodicNotes.find((note) => note.id === selectedNoteId) ?? null;
  const selectedGravity =
    selectedNote && gravityByNoteId.has(selectedNote.id)
      ? gravityByNoteId.get(selectedNote.id) ?? null
      : null;

  useEffect(() => {
    const scroller = scrollRef.current;

    if (!scroller) {
      return;
    }

    const focusNote =
      selectedNote ?? melodicNotes[Math.floor(melodicNotes.length / 2)] ?? null;
    const focusPitch = focusNote?.pitch ?? 60;
    const focusBeat = focusNote?.startBeat ?? 0;
    const contentViewportHeight = scroller.clientHeight - headerHeight;

    scroller.scrollTop = Math.max(
      0,
      getPitchTop(focusPitch) - contentViewportHeight / 2 + rowHeight / 2,
    );
    scroller.scrollLeft = Math.max(0, focusBeat * beatWidth - scroller.clientWidth / 3);
    setScrollTop(scroller.scrollTop);
  }, [beatWidth, melodicNotes, sectionId, selectedNote]);

  useEffect(() => {
    if (!selectedNote) {
      return;
    }

    const selectedNoteIdForKeyboard = selectedNote.id;

    function handleKeyDown(event: KeyboardEvent) {
      const activeElement = document.activeElement;

      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        onRemoveNote(selectedNoteIdForKeyboard);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onRemoveNote, selectedNote]);

  useEffect(() => {
    if (!gesture) {
      return;
    }

    const activeGesture = gesture;

    function getGridLocation(clientX: number, clientY: number) {
      const gridBody = gridBodyRef.current;

      if (!gridBody) {
        return null;
      }

      const rect = gridBody.getBoundingClientRect();
      const relativeX = clamp(clientX - rect.left, 0, gridWidth - 1);
      const relativeY = clamp(clientY - rect.top, 0, gridHeight - 1);

      return {
        cell: clamp(Math.floor(relativeX / subdivisionWidth), 0, totalCells - 1),
        pitch: clamp(maxPitch - Math.floor(relativeY / rowHeight), minPitch, maxPitch),
      };
    }

    function handlePointerMove(event: PointerEvent) {
      const location = getGridLocation(event.clientX, event.clientY);

      if (!location) {
        return;
      }

      setGesture((currentGesture) => {
        if (!currentGesture) {
          return currentGesture;
        }

        switch (currentGesture.kind) {
          case "draw":
            return {
              ...currentGesture,
              currentCell: location.cell,
            };
          case "move": {
            const nextStartCell = clamp(
              location.cell - currentGesture.anchorCellOffset,
              0,
              totalCells - currentGesture.durationCells,
            );
            const nextPitch = clamp(
              currentGesture.pitch + (location.pitch - currentGesture.anchorPitch),
              minPitch,
              maxPitch,
            );

            return {
              ...currentGesture,
              currentStartCell: nextStartCell,
              currentPitch: nextPitch,
            };
          }
          case "resizeStart":
            return {
              ...currentGesture,
              currentStartCell: clamp(location.cell, 0, currentGesture.endCell - 1),
            };
          case "resizeEnd":
            return {
              ...currentGesture,
              currentDurationCells:
                clamp(location.cell + 1, currentGesture.startCell + 1, totalCells) -
                currentGesture.startCell,
            };
          default:
            return currentGesture;
        }
      });
    }

    function handlePointerUp() {
      switch (activeGesture.kind) {
        case "draw": {
          const startCell = Math.min(activeGesture.startCell, activeGesture.currentCell);
          const endCell = Math.max(activeGesture.startCell, activeGesture.currentCell) + 1;

          onAddNote({
            pitch: activeGesture.pitch,
            startBeat: cellToBeat(startCell),
            durationBeats: cellToBeat(endCell - startCell),
          });
          break;
        }
        case "move":
          onUpdateNote(activeGesture.noteId, {
            pitch: activeGesture.currentPitch,
            startBeat: cellToBeat(activeGesture.currentStartCell),
            durationBeats: cellToBeat(activeGesture.durationCells),
          });
          break;
        case "resizeStart":
          onUpdateNote(activeGesture.noteId, {
            pitch: activeGesture.pitch,
            startBeat: cellToBeat(activeGesture.currentStartCell),
            durationBeats: cellToBeat(
              activeGesture.endCell - activeGesture.currentStartCell,
            ),
          });
          break;
        case "resizeEnd":
          onUpdateNote(activeGesture.noteId, {
            pitch: activeGesture.pitch,
            startBeat: cellToBeat(activeGesture.startCell),
            durationBeats: cellToBeat(activeGesture.currentDurationCells),
          });
          break;
      }

      setGesture(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [
    gesture,
    gridHeight,
    gridWidth,
    onAddNote,
    onUpdateNote,
    subdivisionWidth,
    totalCells,
  ]);

  let previewNoteId: number | null = null;
  let previewNote: MelodicNoteModel | null = null;

  if (gesture) {
    switch (gesture.kind) {
      case "draw": {
        const startCell = Math.min(gesture.startCell, gesture.currentCell);
        const endCell = Math.max(gesture.startCell, gesture.currentCell) + 1;

        previewNote = {
          id: -1,
          sectionId,
          pitch: gesture.pitch,
          startBeat: cellToBeat(startCell),
          durationBeats: cellToBeat(endCell - startCell),
        };
        break;
      }
      case "move":
        previewNoteId = gesture.noteId;
        previewNote = {
          id: gesture.noteId,
          sectionId,
          pitch: gesture.currentPitch,
          startBeat: cellToBeat(gesture.currentStartCell),
          durationBeats: cellToBeat(gesture.durationCells),
        };
        break;
      case "resizeStart":
        previewNoteId = gesture.noteId;
        previewNote = {
          id: gesture.noteId,
          sectionId,
          pitch: gesture.pitch,
          startBeat: cellToBeat(gesture.currentStartCell),
          durationBeats: cellToBeat(gesture.endCell - gesture.currentStartCell),
        };
        break;
      case "resizeEnd":
        previewNoteId = gesture.noteId;
        previewNote = {
          id: gesture.noteId,
          sectionId,
          pitch: gesture.pitch,
          startBeat: cellToBeat(gesture.startCell),
          durationBeats: cellToBeat(gesture.currentDurationCells),
        };
        break;
    }
  }

  const renderedNotes = [
    ...melodicNotes.filter((note) => note.id !== previewNoteId),
    ...(previewNote ? [previewNote] : []),
  ].sort((left, right) =>
    left.startBeat === right.startBeat
      ? right.pitch - left.pitch
      : left.startBeat - right.startBeat,
  );

  function getGridLocation(event: ReactPointerEvent<HTMLElement>) {
    const gridBody = gridBodyRef.current;

    if (!gridBody) {
      return null;
    }

    const rect = gridBody.getBoundingClientRect();
    const relativeX = clamp(event.clientX - rect.left, 0, gridWidth - 1);
    const relativeY = clamp(event.clientY - rect.top, 0, gridHeight - 1);

    return {
      cell: clamp(Math.floor(relativeX / subdivisionWidth), 0, totalCells - 1),
      pitch: clamp(maxPitch - Math.floor(relativeY / rowHeight), minPitch, maxPitch),
    };
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "draw", label: "Draw" },
            { key: "select", label: "Select" },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setInteractionMode(option.key as "draw" | "select")}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-accent/15",
                interactionMode === option.key
                  ? "border-accent/35 bg-accent-soft text-foreground"
                  : "border-highlight/80 bg-surface text-foreground/72 hover:border-accent/25 hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-highlight/80 bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/65">
            Snap 1/4 Beat
          </span>
          <button
            type="button"
            onClick={() => setZoomIndex((currentZoom) => clamp(currentZoom - 1, 0, beatWidthLevels.length - 1))}
            disabled={zoomIndex === 0}
            className="rounded-full border border-highlight/80 bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/72 transition hover:border-accent/30 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            Zoom -
          </button>
          <button
            type="button"
            onClick={() => setZoomIndex((currentZoom) => clamp(currentZoom + 1, 0, beatWidthLevels.length - 1))}
            disabled={zoomIndex === beatWidthLevels.length - 1}
            className="rounded-full border border-highlight/80 bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/72 transition hover:border-accent/30 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            Zoom +
          </button>
        </div>
      </div>

      <div className="rounded-[1.45rem] border border-highlight/70 bg-background/45">
        <div className="flex h-[34rem] min-h-[34rem]">
          <div className="w-20 shrink-0 border-r border-highlight/70 bg-background/75">
            <div className="flex h-[52px] items-center justify-center border-b border-highlight/70 px-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-foreground/45">
              Pitch
            </div>
            <div className="relative h-[calc(34rem-52px)] overflow-hidden">
              <div
                className="absolute inset-x-0 top-0"
                style={{
                  height: gridHeight,
                  transform: `translateY(-${scrollTop}px)`,
                }}
              >
                {Array.from({ length: pitchCount }, (_, index) => {
                  const pitch = maxPitch - index;

                  return (
                    <div
                      key={pitch}
                      className={cn(
                        "flex items-center justify-center border-b border-highlight/50 px-2 text-xs font-semibold",
                        isBlackKey(pitch)
                          ? "bg-slate-950/8 text-foreground/72"
                          : "bg-background/55 text-foreground/65",
                        pitch % 12 === 0 && "text-foreground",
                      )}
                      style={{
                        height: rowHeight,
                      }}
                    >
                      {midiToNoteName(pitch)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            ref={scrollRef}
            onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
            className="min-w-0 flex-1 overflow-auto"
          >
            <div style={{ width: gridWidth, minWidth: "100%" }}>
              <div className="sticky top-0 z-20 border-b border-highlight/70 bg-background/95 px-2 py-2 backdrop-blur">
                <div className="flex gap-2" style={{ width: gridWidth }}>
                  {timeline.bars.map((bar) => (
                    <div
                      key={bar.index}
                      className="rounded-full border border-highlight/70 bg-background/55 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-foreground/55"
                      style={{
                        width: bar.beatCount * beatWidth,
                      }}
                    >
                      Bar {bar.index + 1}
                    </div>
                  ))}
                </div>
              </div>

              <div
                ref={gridBodyRef}
                className={cn(
                  "relative select-none",
                  interactionMode === "draw" ? "cursor-crosshair" : "cursor-default",
                )}
                style={{
                  height: gridHeight,
                  width: gridWidth,
                }}
                onPointerDown={(event) => {
                  const location = getGridLocation(event);

                  if (!location) {
                    return;
                  }

                  if (interactionMode === "draw") {
                    event.preventDefault();
                    onSelectNote(null);
                    setGesture({
                      kind: "draw",
                      pitch: location.pitch,
                      startCell: location.cell,
                      currentCell: location.cell,
                    });
                    return;
                  }

                  onSelectNote(null);
                }}
              >
                <div className="absolute inset-0">
                  {Array.from({ length: timeline.barCount }, (_, barIndex) => (
                    <div
                      key={`bar-shade-${barIndex}`}
                      className={cn(
                        "absolute inset-y-0 border-r border-highlight/60",
                        barIndex % 2 === 0 ? "bg-accent/4" : "bg-transparent",
                      )}
                      style={{
                        left: barIndex * timeline.beatsPerBar * beatWidth,
                        width:
                          Math.min(
                            timeline.beatsPerBar,
                            timeline.totalBeats - barIndex * timeline.beatsPerBar,
                          ) * beatWidth,
                      }}
                    />
                  ))}

                  {chordSlots.map((slot) => {
                    const barBeatCount = Math.min(
                      timeline.beatsPerBar,
                      timeline.totalBeats - slot.startBeat,
                    );

                    if (!slot.chord || barBeatCount <= 0) {
                      return null;
                    }

                    return (
                      <div
                        key={slot.barIndex}
                        className="absolute inset-y-0 border-r border-accent/15 bg-accent/6"
                        style={{
                          left: slot.startBeat * beatWidth,
                          width: barBeatCount * beatWidth,
                        }}
                      >
                        <div className="sticky left-2 top-2 z-10 inline-flex rounded-full border border-highlight/70 bg-background/85 px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-foreground/60">
                          {slot.chord.chordName}
                        </div>
                      </div>
                    );
                  })}

                  {Array.from({ length: totalCells + 1 }, (_, index) => (
                    <div
                      key={`vertical-line-${index}`}
                      className={cn(
                        "absolute inset-y-0 border-r",
                        index % snapDivisionsPerBeat === 0
                          ? "border-highlight/55"
                          : "border-highlight/25",
                      )}
                      style={{
                        left: index * subdivisionWidth,
                      }}
                    />
                  ))}

                  {Array.from({ length: pitchCount + 1 }, (_, index) => (
                    <div
                      key={`horizontal-line-${index}`}
                      className="absolute inset-x-0 border-b border-highlight/45"
                      style={{
                        top: index * rowHeight,
                      }}
                    />
                  ))}

                  {Array.from({ length: pitchCount }, (_, index) => {
                    const pitch = maxPitch - index;

                    if (!isBlackKey(pitch)) {
                      return null;
                    }

                    return (
                      <div
                        key={`black-key-row-${pitch}`}
                        className="absolute inset-x-0 bg-slate-950/8"
                        style={{
                          top: index * rowHeight,
                          height: rowHeight,
                        }}
                      />
                    );
                  })}
                </div>

                <div className="absolute inset-0">
                  {renderedNotes.map((note) => {
                    const frame = getNoteFrame(note);
                    const gravity = gravityByNoteId.get(note.id) ?? null;
                    const selected = note.id === selectedNoteId;
                    const preview = note.id < 0 || note.id === previewNoteId;

                    return (
                      <div
                        key={note.id < 0 ? "preview-note" : note.id}
                        className={cn(
                          "absolute z-10 rounded-[0.95rem] border shadow-[0_16px_38px_-28px_rgba(15,23,42,0.7)] transition",
                          gravity
                            ? gravityToneClassName[gravity.gravityClass]
                            : "border-highlight/80 bg-accent-soft text-foreground",
                          selected && "ring-2 ring-foreground/15",
                          interactionMode === "draw" && "pointer-events-none",
                          preview && "opacity-85",
                        )}
                        style={{
                          left: frame.startCell * subdivisionWidth + 2,
                          top: getPitchTop(frame.pitch) + 2,
                          width: frame.durationCells * subdivisionWidth - 4,
                          height: rowHeight - 4,
                        }}
                      >
                        <div
                          role="button"
                          tabIndex={interactionMode === "select" ? 0 : -1}
                          className="flex h-full w-full items-center justify-between gap-2 overflow-hidden rounded-[0.95rem] px-3 text-left focus:outline-none"
                          onPointerDown={(event) => {
                            if (interactionMode !== "select" || note.id < 0) {
                              return;
                            }

                            event.preventDefault();
                            event.stopPropagation();

                            const location = getGridLocation(event);

                            onSelectNote(note.id);

                            if (!location) {
                              return;
                            }

                            setGesture({
                              kind: "move",
                              noteId: note.id,
                              pitch: frame.pitch,
                              durationCells: frame.durationCells,
                              anchorCellOffset: clamp(
                                location.cell - frame.startCell,
                                0,
                                frame.durationCells - 1,
                              ),
                              anchorPitch: location.pitch,
                              currentStartCell: frame.startCell,
                              currentPitch: frame.pitch,
                            });
                          }}
                        >
                          <span className="truncate text-sm font-semibold">
                            {midiToNoteName(frame.pitch)}
                          </span>
                          <span className="shrink-0 text-[0.65rem] font-semibold uppercase tracking-[0.18em] opacity-75">
                            {formatBeatValue(note.durationBeats)}
                          </span>
                        </div>

                        {interactionMode === "select" && note.id >= 0 ? (
                          <>
                            <div
                              className="absolute inset-y-0 left-0 w-2 cursor-ew-resize rounded-l-[0.95rem] bg-foreground/10"
                              onPointerDown={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                onSelectNote(note.id);
                                setGesture({
                                  kind: "resizeStart",
                                  noteId: note.id,
                                  pitch: frame.pitch,
                                  endCell: frame.startCell + frame.durationCells,
                                  currentStartCell: frame.startCell,
                                });
                              }}
                            />
                            <div
                              className="absolute inset-y-0 right-0 w-2 cursor-ew-resize rounded-r-[0.95rem] bg-foreground/10"
                              onPointerDown={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                onSelectNote(note.id);
                                setGesture({
                                  kind: "resizeEnd",
                                  noteId: note.id,
                                  pitch: frame.pitch,
                                  startCell: frame.startCell,
                                  currentDurationCells: frame.durationCells,
                                });
                              }}
                            />
                          </>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[1.35rem] border border-highlight/70 bg-background/55 p-4">
        {selectedNote ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/45">
                  Selected Note
                </p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {midiToNoteName(selectedNote.pitch)}
                </p>
                {selectedGravity ? (
                  <p className="mt-1 text-sm text-muted">
                    {selectedGravity.supportingChord
                      ? `Against ${selectedGravity.supportingChord.chordName}`
                      : "No supporting chord in this bar"}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedGravity ? (
                  <span
                    className={cn(
                      "rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]",
                      gravityToneClassName[selectedGravity.gravityClass],
                    )}
                  >
                    {selectedGravity.label}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => onRemoveNote(selectedNote.id)}
                  className="rounded-full border border-rose-500/25 bg-rose-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-950 transition hover:brightness-95 focus:outline-none focus:ring-4 focus:ring-rose-500/20 dark:text-rose-100"
                >
                  Remove
                </button>
              </div>
            </div>

            {selectedGravity ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1rem] border border-highlight/70 bg-background/55 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/45">
                      Gravity Score
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {selectedGravity.score}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-highlight/70 bg-background/55 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/45">
                      To Chord
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {selectedGravity.intervalToChord}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-highlight/70 bg-background/55 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/45">
                      To Tonic
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {selectedGravity.intervalToTonic}
                    </p>
                  </div>
                </div>

                <p className="text-sm leading-6 text-muted">
                  {selectedGravity.explanation}
                </p>
              </>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/45">
                  Pitch Class
                </span>
                <select
                  value={midiToPitchClass(selectedNote.pitch)}
                  onChange={(event) => {
                    const nextPitchClass = event.currentTarget.value;
                    const octave = Math.floor(selectedNote.pitch / 12) - 1;
                    const nextPitch =
                      pitchClassOptions.indexOf(
                        nextPitchClass as (typeof pitchClassOptions)[number],
                      ) +
                      (octave + 1) * 12;

                    onUpdateNote(selectedNote.id, {
                      pitch: nextPitch,
                      startBeat: selectedNote.startBeat,
                      durationBeats: selectedNote.durationBeats,
                    });
                  }}
                  className="w-full rounded-[1rem] border border-highlight/80 bg-background/55 px-3 py-2 text-base font-semibold text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15"
                >
                  {pitchClassOptions.map((pitchClass) => (
                    <option key={pitchClass} value={pitchClass}>
                      {pitchClass}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/45">
                  Octave
                </span>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={Math.floor(selectedNote.pitch / 12) - 1}
                  onChange={(event) => {
                    const nextOctave = Number(event.currentTarget.value);

                    if (!Number.isFinite(nextOctave)) {
                      return;
                    }

                    const nextPitch =
                      pitchClassOptions.indexOf(
                        midiToPitchClass(selectedNote.pitch),
                      ) +
                      (nextOctave + 1) * 12;

                    onUpdateNote(selectedNote.id, {
                      pitch: nextPitch,
                      startBeat: selectedNote.startBeat,
                      durationBeats: selectedNote.durationBeats,
                    });
                  }}
                  className="w-full rounded-[1rem] border border-highlight/80 bg-background/55 px-3 py-2 text-base font-semibold text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/45">
                  Start Beat
                </span>
                <input
                  type="number"
                  min={1}
                  max={timeline.totalBeats}
                  step={0.25}
                  value={selectedNote.startBeat + 1}
                  onChange={(event) => {
                    const nextStartBeat = Number(event.currentTarget.value) - 1;

                    if (!Number.isFinite(nextStartBeat)) {
                      return;
                    }

                    onUpdateNote(selectedNote.id, {
                      pitch: selectedNote.pitch,
                      startBeat: nextStartBeat,
                      durationBeats: selectedNote.durationBeats,
                    });
                  }}
                  className="w-full rounded-[1rem] border border-highlight/80 bg-background/55 px-3 py-2 text-base font-semibold text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/45">
                  Duration
                </span>
                <input
                  type="number"
                  min={0.25}
                  max={timeline.totalBeats}
                  step={0.25}
                  value={selectedNote.durationBeats}
                  onChange={(event) => {
                    const nextDuration = Number(event.currentTarget.value);

                    if (!Number.isFinite(nextDuration)) {
                      return;
                    }

                    onUpdateNote(selectedNote.id, {
                      pitch: selectedNote.pitch,
                      startBeat: selectedNote.startBeat,
                      durationBeats: nextDuration,
                    });
                  }}
                  className="w-full rounded-[1rem] border border-highlight/80 bg-background/55 px-3 py-2 text-base font-semibold text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15"
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="rounded-[1.2rem] border border-dashed border-highlight bg-background/35 p-4 text-sm leading-6 text-muted">
            {interactionMode === "draw"
              ? "Drag across the grid to place a note. Notes snap to quarter beats and automatically trim overlaps."
              : "Select a note to move, resize, edit exact values, or remove it."}
          </div>
        )}
      </div>
    </div>
  );
}
