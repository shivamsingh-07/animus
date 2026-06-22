# ANIMUS Admin

The catalog dashboard for ANIMUS. Browse and manage every title (in any status)
and ingest new movies: import metadata from TMDB, upload the raw video straight
to S3, and hand it off to the transcoder. Built with React + TypeScript + Vite,
Tailwind CSS, React Router, and Framer Motion.

## How it works

- Talks to the ANIMUS API through the same `ApiResponse<T>` wrapper as the
  client, but adds an `X-Admin-Request: true` header so the API returns titles in
  **every** status (not just `ready`). API calls live in `services/movieApi.ts`
  (catalog CRUD + TMDB import + presigned upload).
- **Dashboard** (`/`) — a table of all titles with headline stats
  (total / ready / in progress / failed), local search, and delete.
- **Add Movie** (`/movies/new`) — the ingest flow:
    1. Paste a TMDB URL; `GET /movies/import` fills in the metadata.
    2. `POST /uploads/presign` returns a presigned S3 `PUT` and creates (or
       reuses) a `created` catalog row.
    3. The browser uploads the file straight to S3 with a progress bar
       (raw `XMLHttpRequest`).
    4. On success the movie is set to `uploaded`, which triggers transcoding on
       the backend.

## Requirements

- **Node 18+** with Yarn.
- A running **ANIMUS API**. The upload flow additionally needs the API's S3
  configuration (and, for `uploaded` -> transcoding, its SQS queue) to be set.

### Environment variables

Create `apps/admin/.env` only if you need to override the default.

| Variable       | Default | Purpose                                                               |
| -------------- | ------- | --------------------------------------------------------------------- |
| `VITE_API_URL` | `/api`  | Base URL of the ANIMUS API (same-origin path; proxied to the backend) |

## Getting started

```bash
cd apps/admin
yarn install
yarn dev           # http://localhost:5174

yarn build         # type-check (tsc) + production build to dist/
yarn preview       # serve the production build locally
```

### Docker

A multi-stage Dockerfile builds the static site and serves it with nginx (SPA
history fallback). The API upstream is injected at startup from the
`API_UPSTREAM` env var (envsubst on `nginx.conf`).

## Project structure

```text
src/
├── animations/   # Framer Motion variants (springs, page transitions)
├── components/   # common/ (GlassCard, StatCard, …) + layout/ (Navbar)
├── hooks/        # useMovies, useDocumentTitle
├── pages/        # DashboardPage, MovieFormPage
├── services/     # apiClient, movieApi (CRUD + upload + TMDB import)
├── types/        # Movie, MovieInput, PresignedUpload, ApiResponse
└── utils/        # cn helper
```

## Credits

Movie metadata & artwork: [The Movie Database (TMDB)](https://www.themoviedb.org/).
This product uses the TMDB API but is not endorsed or certified by TMDB.
