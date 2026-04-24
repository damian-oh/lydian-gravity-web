# Lydian Gravity Web

Next.js frontend for Lydian Gravity, a modal songwriting workspace for sketching
sections, chord motion, melodic ideas, and theory cues. The app talks to the
separate FastAPI backend for authentication, song library storage, arrangement
updates, and next-step harmonic suggestions.

## Stack

- **Framework:** Next.js 16
- **UI:** React 19, Tailwind CSS 4
- **API:** FastAPI backend in a separate repository
- **Package manager:** npm with `package-lock.json`

## Requirements

- Node.js `>=20.9.0`
- npm
- A reachable Lydian Gravity API deployment

The frontend expects the API to expose the `/api/v1` routes used by auth, users,
songs, arrangements, and suggestions.

## Environment

Create `.env.local` for local development:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

For production, set the same variable to the deployed API base URL:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.example/api/v1
```

`NEXT_PUBLIC_API_BASE_URL` is read by the browser bundle. Set it before building
or deploying the app. If it is omitted, the app falls back to
`http://127.0.0.1:8000/api/v1`, which is only useful for local development.

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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

## Deploy to Vercel

1. Import this repository into Vercel.
2. Use the **Next.js** framework preset.
3. Leave the install command as the npm default, or set it to `npm install`.
4. Set the build command to `npm run build`.
5. Add `NEXT_PUBLIC_API_BASE_URL` in Vercel project environment variables.
6. Deploy the project.

Use the production API URL for the Production environment. Use a staging API URL
for Preview deployments if previews should run against separate backend data.

After changing `NEXT_PUBLIC_API_BASE_URL`, redeploy the frontend so the public
environment variable is rebuilt into the client bundle.

## Deployment Verification

After Vercel deploys, verify these flows against the deployed URL:

- Visit `/register` and create an account.
- Visit `/login` and sign in.
- Open `/library` and confirm saved sketches load from the API.
- Create a sketch from `/songs/new`.
- Open a saved song, edit the arrangement, and save it.
- Request next-step suggestions from the theory panel.

## Backend Deployment Notes

The FastAPI backend must be deployed before the frontend can be fully verified.
Confirm the backend:

- Serves the API under the same `/api/v1` base path used by
  `NEXT_PUBLIC_API_BASE_URL`.
- Allows requests from the Vercel production domain and any preview domains that
  need to use the API.
- Uses HTTPS in production.
- Has production database and authentication settings configured separately from
  local development.

## Troubleshooting

- **Unable to reach the API:** Confirm `NEXT_PUBLIC_API_BASE_URL` points to the
  deployed API, includes `/api/v1`, and was set before the latest Vercel deploy.
- **Browser CORS errors:** Add the Vercel deployment domain to the FastAPI CORS
  allowlist.
- **Auth succeeds locally but not in production:** Confirm the production API is
  using the expected auth configuration and that the frontend was rebuilt with
  the production API URL.
- **Library or song pages do not load:** Check that the API is reachable from the
  browser and that the authenticated user has a valid session token.

## Useful Routes

- `/` - public landing page
- `/register` - account creation
- `/login` - sign in
- `/library` - authenticated song library
- `/songs/new` - create a song sketch
- `/songs/[songId]` - edit an existing song sketch
