# Lydian Gravity - Frontend

A Next.js frontend that assists songwriters by generating harmonic suggestions based on Modal Harmony and George Russell's Lydian Chromatic Concept (LCTTO).

## Tech Stack

- **Frontend:** Next.js (React)
- **Backend:** FastAPI (Python) - separate repository
- **Database:** SQLite

## Project Structure

```
src/
└── app/
    ├── layout.tsx       # Root layout
    ├── page.tsx         # Home page
    ├── globals.css      # Global styles (Tailwind)
    └── favicon.ico
public/                  # Static assets
```

## Getting Started

### Prerequisites

- Node.js 20.9.0+
- npm (or yarn/pnpm/bun)
- [Lydian Gravity API](https://github.com/damian-oh/lydian-gravity-fastapi.git) running locally (FastAPI backend)

### Installation

```bash
git clone https://github.com/damian-oh/lydian-gravity-web.git
cd lydian-gravity-web
npm install
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other Commands

```bash
npm run build   # Production build
npm run start   # Start production server
npm run lint    # Run ESLint
```
