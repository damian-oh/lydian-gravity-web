import type { Metadata } from "next";

import { SongSetupForm } from "@/features/song-editor/components/song-setup-form";

export const metadata: Metadata = {
  title: "New Sketch | Lydian Gravity",
  description:
    "Create a song sketch with title, tonal center, mode, tempo, and notes.",
};

export default function NewSongPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
          Setup Flow
        </p>
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            New Sketch
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">
            Shape the song identity here, then move into the editor to refine
            the arrangement.
          </p>
        </div>
      </header>

      <SongSetupForm />
    </div>
  );
}
