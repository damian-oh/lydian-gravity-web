import Link from "next/link";

import { PanelShell } from "@/components/ui/panel-shell";

const metrics = [
  { label: "Saved sketches", value: "0" },
];

export function LibraryDashboard() {
  return (
    <div className="space-y-6">
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
              Move between new sketches, arrangement review, and the current
              library view from one place.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/songs/new"
            scroll={false}
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-accent/25"
          >
            Create Sketch
          </Link>
          <Link
            href="/songs/1"
            scroll={false}
            className="rounded-full border border-highlight/80 bg-surface px-5 py-3 text-sm font-semibold text-foreground/72 transition hover:border-accent/30 hover:text-foreground focus:outline-none focus:ring-4 focus:ring-accent/20"
          >
            Edit Sketch
          </Link>
        </div>
      </header>

      <div>
        <PanelShell
          eyebrow="Library Overview"
          title="No sketches saved yet"
          description="Start a new sketch or open the editor to move into the workspace."
          bodyClassName="space-y-6"
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
            <div className="order-2 rounded-[1.6rem] border border-dashed border-highlight bg-background/40 p-6 sm:p-7 lg:order-1">
              <div className="max-w-xl space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-foreground/45">
                  Next Step
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Start a new sketch or open the editor.
                </h2>
                <p className="text-sm leading-7 text-muted sm:text-base">
                  Use the library to move between song setup and the editor
                  workspace.
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
                <Link
                  href="/songs/1"
                  scroll={false}
                  className="rounded-full border border-highlight/80 bg-surface px-5 py-3 text-sm font-semibold text-foreground/72 transition hover:border-accent/30 hover:text-foreground focus:outline-none focus:ring-4 focus:ring-accent/20"
                >
                  Edit Sketch
                </Link>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-[1.35rem] border border-highlight/70 bg-background/55 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/45">
                    {metric.label}
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </PanelShell>
      </div>
    </div>
  );
}
