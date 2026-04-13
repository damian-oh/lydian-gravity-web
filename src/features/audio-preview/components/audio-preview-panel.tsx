"use client";

import { PanelShell } from "@/components/ui/panel-shell";
import {
  playbackWaveforms,
  type PlaybackWaveform,
} from "@/features/audio-preview/lib/use-section-transport";
import { cn } from "@/lib/cn";

type AudioPreviewPanelProps = Readonly<{
  waveform: PlaybackWaveform;
  masterLevel: number;
  onWaveformChange: (waveform: PlaybackWaveform) => void;
  onMasterLevelChange: (level: number) => void;
}>;

function formatWaveformLabel(waveform: PlaybackWaveform) {
  switch (waveform) {
    case "sawtooth":
      return "Saw";
    default:
      return waveform.charAt(0).toUpperCase() + waveform.slice(1);
  }
}

export function AudioPreviewPanel({
  waveform,
  masterLevel,
  onWaveformChange,
  onMasterLevelChange,
}: AudioPreviewPanelProps) {
  return (
    <PanelShell
      eyebrow="Playback Settings"
      title="Sound and output"
      description="Adjust the preview synth voice and output level for the current section transport."
      bodyClassName="space-y-6"
    >
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/45">
          Waveform
        </p>
        <div className="flex flex-wrap gap-2">
          {playbackWaveforms.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onWaveformChange(option)}
              className={cn(
                "rounded-full border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-accent/15",
                waveform === option
                  ? "border-accent/40 bg-accent-soft text-foreground"
                  : "border-highlight/80 bg-surface text-foreground/72 hover:border-accent/25 hover:text-foreground",
              )}
            >
              {formatWaveformLabel(option)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[1.25rem] border border-highlight/70 bg-background/45 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/45">
              Master Level
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {Math.round(masterLevel * 100)}%
            </p>
          </div>
          <span className="rounded-full border border-highlight/80 bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/65">
            {formatWaveformLabel(waveform)}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={masterLevel}
          onChange={(event) =>
            onMasterLevelChange(Number.parseFloat(event.currentTarget.value))
          }
          className="mt-4 h-2 w-full cursor-pointer accent-[var(--accent)]"
          aria-label="Master level"
        />
      </div>
    </PanelShell>
  );
}
