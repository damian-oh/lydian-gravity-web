import Link from "next/link";

import { PanelShell } from "@/components/ui/panel-shell";

export default function SongNotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <PanelShell
        eyebrow="Unknown Song"
        title="Song not found"
        className="w-full max-w-xl"
        bodyClassName="space-y-4"
      >
        <div className="flex flex-wrap gap-3">
          <Link
            href="/songs/new"
            scroll={false}
            className="rounded-full border border-highlight/80 bg-surface px-5 py-3 text-sm font-semibold text-foreground/72 transition hover:border-accent/30 hover:text-foreground focus:outline-none focus:ring-4 focus:ring-accent/20"
          >
            Create Sketch
          </Link>
          <Link
            href="/library"
            scroll={false}
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-accent/25"
          >
            Library
          </Link>
        </div>
      </PanelShell>
    </div>
  );
}
