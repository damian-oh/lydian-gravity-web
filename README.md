# Lydian Gravity Web

Next.js frontend for **Lydian Gravity**, a full-stack songwriting workspace for
sketching modal harmony, arranging song sections, shaping melody ideas, and
requesting theory-aware next-step suggestions.

This repository is the portfolio-facing client. It connects to the companion
FastAPI backend:
[lydian-gravity-fastapi](https://github.com/damian-oh/lydian-gravity-fastapi).

## Live Demo

**<https://lydiangravity.damianoh.com>**

Demo mode is on, so you can enter the workspace without registering. The
backend runs on a free-tier instance with an ephemeral filesystem, so saved
sketches reset when it restarts.

## Project Highlights

- **Complete authenticated flow:** Register, log in, persist a session token,
  and enter a protected songwriting workspace.
- **Song library dashboard:** Load saved sketches from the API, review tonal
  centers, modes, tempos, time signatures, section counts, and update times.
- **Guided song setup:** Start new sketches with title, tonal center, mode,
  tempo, meter, and notes before entering the editor.
- **Section-based arrangement editor:** Add, remove, resize, and switch between
  A/B/C/D sections while preserving stable ordering.
- **Modal chord workflow:** Choose diatonic chords, secondary dominants, and
  modal-interchange colors from a generated chord catalog.
- **Melody lane editing:** Add, drag, resize, clamp, and normalize monophonic
  MIDI-note melody events against the active section timeline.
- **Theory panel integration:** Request backend-generated chord suggestions,
  pitch collections, melody prompts, rhythm prompts, and modal-interchange
  insights for the current context.
- **Browser audio preview:** Audition section chords and melody notes with Web
  Audio transport controls, loop/metronome toggles, waveforms, and output level.

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 |
| UI | React 19, Tailwind CSS 4 |
| Language | TypeScript |
| API | FastAPI backend over `NEXT_PUBLIC_API_BASE_URL` |
| Tooling | npm, ESLint |

## Application Flow

```text
Public landing page
        |
        |-- Register / Login
        |
        `-- Authenticated app shell
                |-- Library dashboard
                |-- New sketch setup
                `-- Song editor
                        |-- Section timeline
                        |-- Chord picker
                        |-- Melody lane
                        |-- Theory panel
                        `-- Audio preview transport
```

Core routes:

| Route | Purpose |
| --- | --- |
| `/` | Public landing page |
| `/register` | Account creation |
| `/login` | Sign in |
| `/library` | Authenticated saved-sketch dashboard |
| `/songs/new` | Create a new song sketch |
| `/songs/[songId]` | Edit a saved song sketch |

## Backend Integration

The app expects the FastAPI service to expose the same `/api/v1` contract used
by the backend repository.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | API base URL, including the `/api/v1` prefix. Falls back to `http://127.0.0.1:8000/api/v1` |
| `NEXT_PUBLIC_DEMO_MODE` | Set to `true` to offer a no-registration demo account. Requires `DEMO_MODE=True` on the backend |

Create `.env.local` for local development:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
NEXT_PUBLIC_DEMO_MODE=true
```

Both are bundled into client-side code at build time, so changing either one
requires a rebuild rather than a restart.

## Local Development

### Requirements

- Node.js `>=20.9.0`
- npm
- A running or deployed Lydian Gravity FastAPI backend

### Install

```bash
npm install
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For a full local stack, start the backend from the companion repo first:

```bash
uv run fastapi dev app/main.py
```

Then set `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1` in
`.env.local`.

## Quality Checks

Run ESLint:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

Run the production server locally after building:

```bash
npm run start
```

## Deployment

A standard Next.js deployment; the live instance runs on Vercel with the
framework preset and no custom configuration.

Set both environment variables **before** the first build, since they are
inlined into the bundle. The backend's `BACKEND_CORS_ORIGINS` allowlist must
name the deployed frontend origin exactly, or every API call is blocked by
CORS.

## Companion Project

The backend lives in
[lydian-gravity-fastapi](https://github.com/damian-oh/lydian-gravity-fastapi).
It provides authentication, user-scoped persistence, arrangement storage, and
deterministic music-theory suggestion APIs for this client.
