"use client";

import type {
  TransportActions,
  TransportState,
} from "@/features/audio-preview/lib/use-section-transport";
import { cn } from "@/lib/cn";

type TransportBarProps = Readonly<{
  sectionLabel: string;
  tempoBpm: number;
  timeSignature: string;
  transport: TransportState;
  actions: Pick<
    TransportActions,
    "pause" | "play" | "seek" | "stop" | "toggleLoop" | "toggleMetronome"
  >;
}>;

function formatStatusLabel(status: TransportState["status"]) {
  switch (status) {
    case "playing":
      return "Playing";
    case "paused":
      return "Paused";
    default:
      return "Stopped";
  }
}

function formatBeatValue(value: number) {
  const roundedValue = Math.round(value * 100) / 100;

  return Number.isInteger(roundedValue)
    ? String(roundedValue)
    : roundedValue.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function getDisplayBarAndBeat(
  currentBeat: number,
  totalBeats: number,
  beatsPerBar: number,
) {
  const safeBeat = Math.min(
    Math.max(0, currentBeat),
    Math.max(0, totalBeats - 0.001),
  );
  const bar = Math.floor(safeBeat / beatsPerBar) + 1;
  const beatInBar = safeBeat - (bar - 1) * beatsPerBar + 1;

  return {
    bar,
    beatInBar: formatBeatValue(beatInBar),
  };
}

export function TransportBar({
  sectionLabel,
  tempoBpm,
  timeSignature,
  transport,
  actions,
}: TransportBarProps) {
  const playButtonLabel =
    transport.status === "playing" ? "Pause" : "Play";
  const displayPosition = getDisplayBarAndBeat(
    transport.currentBeat,
    transport.totalBeats,
    transport.beatsPerBar,
  );

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-highlight/80 bg-surface/85 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.4)] backdrop-blur-xl">
      <div className="border-b border-highlight/70 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-foreground/45">
              Transport
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Current section playback
              </h2>
              <span className="rounded-full border border-highlight/80 bg-background/45 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/65">
                {sectionLabel}
              </span>
              <span className="rounded-full border border-highlight/80 bg-background/45 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/65">
                {formatStatusLabel(transport.status)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={
                transport.status === "playing" ? actions.pause : actions.play
              }
              className="rounded-full border border-accent/35 bg-accent-soft px-4 py-2 text-sm font-semibold text-foreground transition hover:brightness-95 focus:outline-none focus:ring-4 focus:ring-accent/15"
            >
              {playButtonLabel}
            </button>
            <button
              type="button"
              onClick={actions.stop}
              className="rounded-full border border-highlight/80 bg-background/45 px-4 py-2 text-sm font-semibold text-foreground/72 transition hover:border-accent/30 hover:text-foreground focus:outline-none focus:ring-4 focus:ring-accent/15"
            >
              Stop
            </button>
            <button
              type="button"
              onClick={actions.toggleLoop}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-accent/15",
                transport.loopEnabled
                  ? "border-accent/35 bg-accent-soft text-foreground"
                  : "border-highlight/80 bg-background/45 text-foreground/72 hover:border-accent/30 hover:text-foreground",
              )}
            >
              Loop
            </button>
            <button
              type="button"
              onClick={actions.toggleMetronome}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-accent/15",
                transport.metronomeEnabled
                  ? "border-accent/35 bg-accent-soft text-foreground"
                  : "border-highlight/80 bg-background/45 text-foreground/72 hover:border-accent/30 hover:text-foreground",
              )}
            >
              Metronome
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="rounded-[1.15rem] border border-highlight/70 bg-background/45 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/45">
              Position
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              Bar {displayPosition.bar} • Beat {displayPosition.beatInBar}
            </p>
          </div>
          <div className="rounded-[1.15rem] border border-highlight/70 bg-background/45 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/45">
              Duration
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {transport.barCount} bars • {transport.totalBeats} beats
            </p>
          </div>
          <div className="rounded-[1.15rem] border border-highlight/70 bg-background/45 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/45">
              Tempo
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {tempoBpm} BPM • {timeSignature}
            </p>
          </div>
          <div className="rounded-[1.15rem] border border-highlight/70 bg-background/45 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/45">
              Progress
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {Math.round(transport.progress * 100)}%
            </p>
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-highlight/70 bg-background/45 px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/45">
              Section Playhead
            </p>
            <p className="text-sm font-semibold text-muted">
              Beat {formatBeatValue(Math.min(transport.currentBeat + 1, transport.totalBeats))}{" "}
              of {transport.totalBeats}
            </p>
          </div>

          <input
            type="range"
            min={0}
            max={transport.totalBeats}
            step={0.25}
            value={Math.min(transport.currentBeat, transport.totalBeats)}
            onChange={(event) =>
              actions.seek(Number.parseFloat(event.currentTarget.value))
            }
            className="mt-4 h-2 w-full cursor-pointer accent-[var(--accent)]"
            aria-label="Section playhead"
          />
        </div>
      </div>
    </section>
  );
}
