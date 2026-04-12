# Lydian Gravity Color Scheme

This document records the color system for the frontend and distinguishes between what is implemented today and the palette we intend to standardize on next.

## Status

- Current implementation: partial
- Global theme tokens currently implemented in `src/app/globals.css`: `background`, `foreground`
- Font status: `src/app/layout.tsx` loads `Geist` and `Geist Mono`, but `body` in `src/app/globals.css` still uses `Arial, Helvetica, sans-serif`
- Homepage status: `src/app/page.tsx` still uses hard-coded `slate`, `cyan`, and `blue` utility classes instead of semantic theme tokens

## Current Implementation

### Global Tokens

The app currently defines two root CSS variables and exposes them to Tailwind through `@theme inline`.

| Token | Light | Dark | Purpose |
| :--- | :--- | :--- | :--- |
| `--background` | `#FFFFFF` | `#0A0A0A` | App background and large surface areas |
| `--foreground` | `#171717` | `#EDEDED` | Default text color |

These are mapped in `src/app/globals.css` as:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

### Dark Mode Behavior

Dark mode is controlled by `@media (prefers-color-scheme: dark)` in `src/app/globals.css`.

| Mode | Background | Foreground |
| :--- | :--- | :--- |
| Light | `#FFFFFF` | `#171717` |
| Dark | `#0A0A0A` | `#EDEDED` |

### Typography Notes

- `Geist` and `Geist Mono` are loaded in `src/app/layout.tsx`
- `--font-sans` and `--font-mono` are exposed through `@theme inline`
- `body` currently overrides the default text stack with `Arial, Helvetica, sans-serif`
- Components should prefer semantic font tokens or Tailwind font utilities once the typography system is standardized

### Known Gap

The landing page is not yet using the global semantic color tokens. It currently applies these utility colors directly:

- `bg-slate-900`
- `text-white`
- `text-slate-400`
- `border-slate-700`
- `bg-slate-800/50`
- `from-cyan-400`
- `to-blue-600`

Until those are migrated, this document should be treated as the desired color direction plus a record of the current implementation.

## Target Palette

This is the intended palette to standardize the UI around as the app moves away from hard-coded Tailwind colors.

| Role | Hex | Intended Use |
| :--- | :--- | :--- |
| `background` | `#F1F5F9` | Primary page background and large surfaces |
| `foreground` | `#0F172A` | Primary text and high-emphasis UI content |
| `accent` | `#F59E0B` | Active states, emphasis, calls to action, and tonal highlights |
| `highlight` | `#E2E8F0` | Borders, dividers, muted surfaces, and secondary panels |

### Palette Intent

- `background` should feel clean and paper-like rather than pure white
- `foreground` should carry most typography and structural contrast
- `accent` should be used sparingly so it remains meaningful
- `highlight` should support layout structure without competing with text

## Planned Tailwind Tokens

When the UI is migrated to the target palette, `src/app/globals.css` should expose semantic tokens like this:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-accent: var(--accent);
  --color-highlight: var(--highlight);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

The corresponding root variables would then define the actual light and dark values.

## Usage Rules

- Prefer semantic tokens such as `bg-background` and `text-foreground` over raw palette utilities in app code
- Reserve `accent` for interactive or musically meaningful emphasis, not for general decoration
- Use `highlight` for borders and low-emphasis surfaces before introducing additional neutral colors
- Keep body text and primary headings on `foreground` unless a component has a documented exception
- If a component needs a one-off color outside this system, document the reason in the component or a follow-up design note

## Next Step

When the homepage and future components are updated to consume semantic tokens, this file should be simplified by removing the "Known Gap" section and promoting the target palette to the implemented standard.
