# Lydian Gravity Web

Next.js frontend for **Lydian Gravity**, a full-stack songwriting workspace for
sketching modal harmony, arranging song sections, shaping melody ideas, and
requesting theory-aware next-step suggestions.

This repository is the portfolio-facing client. It connects to the companion
FastAPI backend:
[lydian-gravity-fastapi](https://github.com/damian-oh/lydian-gravity-fastapi).

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

Create `.env.local` for local development:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

For production, set the same variable to the deployed API base URL:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.example/api/v1
```

`NEXT_PUBLIC_API_BASE_URL` is bundled into client-side code at build time. If it
is omitted, the app falls back to `http://127.0.0.1:8000/api/v1`, which is only
useful for local development.

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

## Deployment Notes

This app is designed for a standard Next.js deployment, such as Vercel.

Deployment checklist:

- Use the Next.js framework preset.
- Install dependencies with `npm install`.
- Build with `npm run build`.
- Set `NEXT_PUBLIC_API_BASE_URL` to the deployed FastAPI `/api/v1` URL before
  building.
- Configure the backend CORS allowlist with the deployed frontend origin.
- Redeploy the frontend after changing `NEXT_PUBLIC_API_BASE_URL`.

After deployment, verify the main user flows:

- Register a new account.
- Log in.
- Open the library.
- Create a new sketch.
- Edit and save an arrangement.
- Request theory suggestions from the editor.
- Play back a section through the browser audio preview.

## Companion Project

The backend lives in
[lydian-gravity-fastapi](https://github.com/damian-oh/lydian-gravity-fastapi).
It provides authentication, user-scoped persistence, arrangement storage, and
deterministic music-theory suggestion APIs for this client.
