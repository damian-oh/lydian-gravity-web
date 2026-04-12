# Lydian Gravity Color Scheme

This document records the color system for the frontend and distinguishes between what is implemented today and the palette we intend to standardize on next.

## Status

- Current implementation: active across global styles, auth screens, and the landing page
- Global theme tokens currently implemented in `src/app/globals.css`: `background`, `foreground`, `accent`, `highlight`
- Font status: `src/app/layout.tsx` loads `Geist` and `Geist Mono`, and `body` in `src/app/globals.css` uses `var(--font-geist-sans)`
- Homepage status: `src/app/page.tsx` uses semantic theme tokens and includes auth navigation to `/login` and `/register`

## Current Implementation

### Global Tokens

The app currently defines four root CSS variables and exposes them to Tailwind through `@theme inline`.

| Token | Light | Dark | Purpose |
| :--- | :--- | :--- | :--- |
| `--background` | `#F1F5F9` | `#020617` | App background and large surface areas |
| `--foreground` | `#0F172A` | `#E2E8F0` | Default text color and high-emphasis UI content |
| `--accent` | `#F59E0B` | `#FBBF24` | Active states, emphasis, and calls to action |
| `--highlight` | `#E2E8F0` | `#334155` | Borders, dividers, muted surfaces, and secondary panels |

These are mapped in `src/app/globals.css` as:

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

### Dark Mode Behavior

Dark mode is controlled by `@media (prefers-color-scheme: dark)` in `src/app/globals.css`.

| Mode | Background | Foreground | Accent | Highlight |
| :--- | :--- | :--- | :--- | :--- |
| Light | `#F1F5F9` | `#0F172A` | `#F59E0B` | `#E2E8F0` |
| Dark | `#020617` | `#E2E8F0` | `#FBBF24` | `#334155` |

### Typography Notes

- `Geist` and `Geist Mono` are loaded in `src/app/layout.tsx`
- `--font-sans` and `--font-mono` are exposed through `@theme inline`
- `body` uses `var(--font-geist-sans), sans-serif`
- Components should prefer semantic font tokens or Tailwind font utilities once the typography system is standardized

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

## Implemented Tailwind Tokens

`src/app/globals.css` exposes semantic tokens like this:

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

The root variables define the light and dark values listed above.

## Usage Rules

- Prefer semantic tokens such as `bg-background` and `text-foreground` over raw palette utilities in app code
- Reserve `accent` for interactive or musically meaningful emphasis, not for general decoration
- Use `highlight` for borders and low-emphasis surfaces before introducing additional neutral colors
- Keep body text and primary headings on `foreground` unless a component has a documented exception
- If a component needs a one-off color outside this system, document the reason in the component or a follow-up design note

## Next Step

As future components are added, they should continue consuming semantic theme tokens rather than introducing raw palette utilities.
