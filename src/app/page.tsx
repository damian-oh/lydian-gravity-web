import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
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

          <nav className="flex items-center gap-3 text-sm font-semibold">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-foreground/70 transition hover:bg-highlight/70 hover:text-foreground focus:outline-none focus:ring-4 focus:ring-highlight/80"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-accent px-4 py-2 uppercase tracking-[0.16em] text-slate-950 transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-accent/25"
            >
              Register
            </Link>
          </nav>
        </header>

        <section className="flex flex-1 items-center py-16 sm:py-20">
          <div className="w-full">
            <div className="max-w-2xl space-y-6">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-accent">
                Harmonic thinking for the modern web
              </p>
              <h1 className="text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
                Lydian Gravity
              </h1>
              <p className="text-lg leading-8 text-foreground/70 sm:text-xl">
                Bridging the gap between George Russell and the modern web.
              </p>
              <p className="max-w-xl text-base leading-7 text-foreground/65">
                Build song sketches with a palette that feels grounded,
                intentional, and ready to expand into the rest of the
                application.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
