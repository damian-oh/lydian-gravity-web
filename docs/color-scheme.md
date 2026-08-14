# Lydian Gravity Color Scheme

This document records the color and typography system for the frontend: the tokens defined in `src/app/globals.css`, how components consume them, which raw-palette exceptions are sanctioned, and which gaps are still open.

## Status

- All theme tokens live in `src/app/globals.css` — eight color tokens plus two font tokens
- There is no `tailwind.config.*`; Tailwind v4 is configured entirely through `@tailwindcss/postcss` and the `@theme inline` block, so `globals.css` is the single source of truth
- Dark mode is OS-driven via `@media (prefers-color-scheme: dark)`; there is no in-app theme toggle
- No webfonts are loaded — typography uses system font stacks
- Semantic tokens are consumed across the whole app: global styles, the landing page, auth screens, the app shell, the library dashboard, the song editor, and the theory panel

## Global Tokens

`:root` defines eight color tokens, each with a dark-mode override.

| Token             | Light     | Dark      | Purpose                                                       |
| :---------------- | :-------- | :-------- | :------------------------------------------------------------ |
| `--background`    | `#f1f5f9` | `#020617` | App background and large surface areas                        |
| `--foreground`    | `#0f172a` | `#e2e8f0` | Default text color and high-emphasis UI content               |
| `--accent`        | `#f59e0b` | `#fbbf24` | Active states, emphasis, and calls to action                  |
| `--highlight`     | `#e2e8f0` | `#334155` | Borders, dividers, muted surfaces, and secondary panels       |
| `--surface`       | `#ffffff` | `#0f172a` | Raised panels and cards sitting above the background          |
| `--surface-strong`| `#dbe4ef` | `#1e293b` | Intended for the most raised surfaces — currently unused      |
| `--muted`         | `#475569` | `#94a3b8` | Secondary and supporting body text                            |
| `--accent-soft`   | `#fef3c7` | `#422006` | Tonal accent fills where full `accent` would be too loud      |

## Tailwind Mapping

`@theme inline` exposes every token to Tailwind as a utility-generating color, and maps the two font tokens onto the `font-sans` / `font-mono` families:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-accent: var(--accent);
  --color-highlight: var(--highlight);
  --color-surface: var(--surface);
  --color-surface-strong: var(--surface-strong);
  --color-muted: var(--muted);
  --color-accent-soft: var(--accent-soft);
  --font-sans: var(--font-body);
  --font-mono: var(--font-code);
}
```

This is what makes `bg-background`, `text-foreground`, `border-highlight`, `bg-surface`, `text-muted`, `bg-accent-soft`, and friends resolve.

## Dark Mode Behavior

Dark mode is controlled solely by `@media (prefers-color-scheme: dark)` in `src/app/globals.css`, which re-declares the eight color tokens. Because every token flips at the `:root` level, most components need no dark-mode handling at all — they consume tokens and follow automatically.

Two consequences worth knowing:

- **There is no theme toggle.** No `next-themes`, no `ThemeProvider`, no `.dark` class or `data-theme` attribute. The theme follows the OS setting and cannot be overridden in-app.
- **`dark:` utilities resolve to the same media query.** Tailwind v4's default `dark:` variant compiles to `prefers-color-scheme: dark`, so the `dark:` classes used in components stay consistent with `globals.css`. If a class-based toggle is ever introduced, Tailwind's `darkMode` strategy must be reconfigured or every existing `dark:` site silently stops matching.

## Typography

`:root` defines two font tokens, both plain CSS font stacks:

```css
--font-body: "Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif;
--font-code: "IBM Plex Mono", "SFMono-Regular", "Cascadia Code", monospace;
```

- **No fonts are loaded.** `src/app/layout.tsx` imports no `next/font` face and there is no webfont link — these stacks resolve against whatever the OS provides. `"Avenir Next"` is macOS-only and `"Segoe UI"` is Windows-only, so Linux falls through to generic `sans-serif`.
- `body` sets `font-family: var(--font-body)`, so body copy inherits the sans stack globally.
- `--font-code` currently has **no consumers**: neither `font-mono` nor `font-sans` utilities appear in any component. It is wired up and ready, but unused.

## Usage Rules

- Prefer semantic tokens such as `bg-background`, `text-foreground`, `bg-surface`, and `text-muted` over raw palette utilities in app code
- Reserve `accent` for interactive or musically meaningful emphasis, not for general decoration — it stays meaningful only if it stays rare; reach for `accent-soft` when a tonal fill is enough
- Use `highlight` for borders and low-emphasis surfaces before introducing additional neutral colors
- Keep body text and primary headings on `foreground`, and secondary copy on `muted`, unless a component has a documented exception
- `background` should feel clean and paper-like rather than pure white; `surface` is the pure-white layer that sits on top of it
- If a component needs a one-off color outside this system, document the reason below

The rule above is the standard, not a description of the current state: 138 raw-palette utility occurrences across 12 files, plus 21 hard-coded `rgba()` literals across 11 files, remain — concentrated in the song editor, theory panel, library dashboard, and app shell. The next section records which of those are sanctioned; anything not listed there should migrate to tokens.

## Documented Exceptions

### Sanctioned: the gravity and theory tone ramps

These encode meaning, not decoration — the hue *is* the information — so they intentionally sit outside the neutral token system.

`src/features/song-editor/components/melody-lane-editor.tsx` grades each note by its pull against the active chord, using an ordered ramp from consonance to dissonance:

| Tone      | Family    |
| :-------- | :-------- |
| `anchor`  | `emerald` |
| `stable`  | `sky`     |
| `color`   | `amber`   |
| `tension` | `orange`  |
| `outside` | `rose`    |

`src/features/theory/components/theory-panel.tsx` uses a parallel scheme for chord-suggestion sources: `grounded` → `emerald`, `lift` → `sky`, `borrowed` → `amber`, `release` → `violet`.

Both follow the shape `border-X-500/25…35 bg-X-500/10…18 text-X-950 dark:text-X-100`. Keep new tones in that shape so the ramps stay visually coherent.

### Sanctioned: status colors

`rose-500` signals error/destructive and `emerald-500` signals success — see `src/features/auth/components/auth-message.tsx`, `auth-input-field.tsx`, and `src/components/ui/confirm-dialog.tsx`. There are no `danger`/`success` tokens yet, so these raw utilities are currently the only way to express status.

### Tolerated, pending tokens

- **`text-slate-950` is the on-accent foreground.** Any `bg-accent` surface pairs with `text-slate-950` for legible contrast in both themes — 12 occurrences across 8 files, including `src/app/page.tsx`, `src/features/auth/components/auth-primary-button.tsx`, and `src/features/library/components/library-dashboard.tsx`. There is no `--on-accent` token, so this is load-bearing: do **not** "clean it up" to `text-foreground`, which would flip to near-invisible in dark mode.
- **Scrims and shadows use raw literals.** `bg-slate-950/8` for grid shading, `bg-slate-950/35` and `backdrop:bg-slate-950/45` for modal scrims, plus `rgba(15, 23, 42, …)` shadows and inlined `rgba(245, 158, 11, …)` / `rgba(251, 191, 36, …)` accent glows in arbitrary-value classes. The accent literals are the light and dark accent hexes copied by hand, so they do not track `--accent` if it changes.

## Known Gaps

Open items — recorded so they read as unfinished rather than intentional:

- `--surface-strong` is defined and mapped but has zero consumers anywhere in `src/`
- `--font-code` is defined and mapped but unused; no component uses `font-mono` or `font-sans`
- `::selection` in `globals.css` hard-codes `rgb(245 158 11 / 0.22)` — the *light* accent — and is not re-declared in the dark block, so the selection highlight does not shift with the theme
- No `danger`, `success`, `on-accent`, or `scrim` tokens exist, despite the code needing all four; adding them would let most of the "tolerated" exceptions above migrate to tokens
