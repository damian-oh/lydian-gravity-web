export function LoginForm() {
  return (
    <form className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-sm font-medium text-foreground/80"
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          className="w-full rounded-2xl border border-highlight bg-background/75 px-4 py-3 text-base text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor="password"
            className="text-sm font-medium text-foreground/80"
          >
            Password
          </label>
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-foreground/45">
            Secure entry
          </span>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          required
          minLength={8}
          className="w-full rounded-2xl border border-highlight bg-background/75 px-4 py-3 text-base text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15"
        />
      </div>

      <button
        type="button"
        className="inline-flex w-full items-center justify-center rounded-2xl bg-accent px-4 py-3 text-m font-semibold tracking-[0.08em] text-slate-950 transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-accent/25"
      >
        Sign In
      </button>

      <button
        type="button"
        className="inline-flex w-full items-center justify-center rounded-2xl bg-accent px-4 py-3 text-m font-semibold tracking-[0.08em] text-slate-950 transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-accent/25"
      >
        Register
      </button>
    </form>
  );
}
