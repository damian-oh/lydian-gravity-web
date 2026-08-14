import Link from "next/link";

import { DemoCtaLink } from "@/features/auth/components/demo-cta-link";
import { LandingAuthNav } from "@/features/auth/components/landing-auth-nav";
import { isDemoMode } from "@/features/auth/lib/demo-config";

const featureCards = [
  {
    title: "Harmony Lane",
    eyebrow: "Progression",
    description:
      "A theory-aware chord palette per bar: diatonic colors, secondary dominants, and modal borrowings.",
  },
  {
    title: "Melody Gravity",
    eyebrow: "Piano Roll",
    description:
      "Draw notes on a beat-snapped grid, each graded by its pull against the active chord.",
  },
  {
    title: "Hear It Instantly",
    eyebrow: "Playback",
    description:
      "Loop, metronome, and per-section playback — with prompts for the next harmonic move.",
  },
] as const;

// Stylized stand-in for a product screenshot; swap for real captures once
// they exist in public/screenshots, e.g.:
// <Image src="/screenshots/editor-light.png" ... className="dark:hidden" />
// <Image src="/screenshots/editor-dark.png" ... className="hidden dark:block" />
const mockChords = [
  { name: "Cmaj7", source: "Diatonic", tone: "border-accent/40 bg-accent-soft" },
  { name: "D7", source: "Sec. Dom", tone: "border-sky-500/35 bg-sky-500/12" },
  {
    name: "F♯m7♭5",
    source: "Lydian",
    tone: "border-accent/40 bg-accent-soft",
  },
  {
    name: "Fmaj7",
    source: "Borrowed",
    tone: "border-amber-500/40 bg-amber-500/12",
  },
] as const;

function EditorMockPanel() {
  return (
    <div
      aria-hidden="true"
      className="rounded-[1.75rem] border border-highlight/80 bg-surface/85 p-5 shadow-[0_36px_90px_-50px_rgba(15,23,42,0.6)] backdrop-blur-xl"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-foreground/45">
          Harmony Lane · Section A
        </p>
        <span className="rounded-full border border-highlight/80 bg-background/55 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-foreground/55">
          92 BPM · 4/4
        </span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {["Bar 1", "Bar 2", "Bar 3", "Bar 4"].map((bar) => (
          <div
            key={bar}
            className="rounded-full border border-highlight/70 bg-background/45 px-2 py-1 text-center text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-foreground/45"
          >
            {bar}
          </div>
        ))}
      </div>

      <div className="relative mt-2 overflow-hidden rounded-[1.2rem] border border-highlight/70 bg-background/45">
        <div className="pointer-events-none absolute inset-0 grid grid-cols-8">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="border-r border-highlight/40" />
          ))}
        </div>
        <div className="absolute inset-y-0 left-[38%] w-0.5 bg-accent shadow-[0_0_8px_rgba(245,158,11,0.6)]" />

        <div className="relative grid grid-cols-4 gap-1.5 p-1.5">
          {mockChords.map((chord) => (
            <div
              key={chord.name}
              className={`rounded-[0.95rem] border px-2.5 py-3 ${chord.tone}`}
            >
              <p className="text-sm font-semibold text-foreground">
                {chord.name}
              </p>
              <p className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-foreground/50">
                {chord.source}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {[
          { left: "8%", width: "16%", tone: "bg-emerald-500/50" },
          { left: "30%", width: "22%", tone: "bg-sky-500/50" },
          { left: "58%", width: "12%", tone: "bg-amber-500/55" },
          { left: "74%", width: "18%", tone: "bg-rose-500/45" },
        ].map((note) => (
          <div
            key={note.left}
            className="relative h-3.5 overflow-hidden rounded-full bg-background/45"
          >
            <div
              className={`absolute inset-y-0 rounded-full ${note.tone}`}
              style={{ left: note.left, width: note.width }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-clip bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.16),_transparent_35%)] dark:bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.16),_transparent_35%)]" />
      <div className="absolute left-[-7rem] top-24 h-72 w-72 rounded-full bg-highlight/70 blur-3xl" />
      <div className="absolute bottom-[-7rem] right-[-5rem] h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-highlight to-transparent" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6 sm:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-highlight/80 pb-5">
          <Link
            href="/"
            className="text-sm font-semibold tracking-[0.28em] text-foreground/70 transition hover:text-foreground focus:outline-none focus:underline"
          >
            LYDIAN GRAVITY
          </Link>

          <LandingAuthNav />
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 sm:py-20 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
              Lydian Gravity
            </h1>
            <p className="text-lg leading-8 text-foreground/70 sm:text-xl">
              A songwriting workspace built on George Russell&apos;s Lydian
              Chromatic Concept.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {isDemoMode ? (
                <DemoCtaLink className="rounded-full bg-accent px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-accent/25">
                  Try the live demo
                </DemoCtaLink>
              ) : (
                <Link
                  href="/register"
                  className="rounded-full bg-accent px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-accent/25"
                >
                  Create an account
                </Link>
              )}
              <Link
                href="/login"
                className="rounded-full border border-highlight/80 bg-surface px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-foreground/72 transition hover:border-accent/30 hover:text-foreground focus:outline-none focus:ring-4 focus:ring-accent/20"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <EditorMockPanel />
          </div>
        </section>

        <section className="grid gap-4 border-t border-highlight/80 py-12 sm:grid-cols-3">
          {featureCards.map((card) => (
            <div
              key={card.title}
              className="rounded-[1.35rem] border border-highlight/80 bg-background/45 p-5"
            >
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-accent">
                {card.eyebrow}
              </p>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                {card.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {card.description}
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
