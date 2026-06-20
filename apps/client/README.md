# ANIMUS Client

The public streaming website for ANIMUS. Browse the catalog, open a title, and
watch it in a custom adaptive-bitrate player. Built with React + TypeScript +
Vite, Tailwind CSS, React Router, Framer Motion, and dash.js.

## How it works

- Reads the catalog from the ANIMUS API through a small `fetch` wrapper
  (`services/apiClient.ts`) that unwraps the `ApiResponse<T>` envelope; the movie
  calls live in `services/movieApi.ts`.
- The home grid is driven by `GET /movies/search` (an empty query lists all
  `ready` titles); the details page loads a single movie by id.
- Playback uses **dash.js** (lazy-loaded) against the movie's `manifest_url`.
  `usePlayer` owns the `<video>` element and HTML5 state (play/seek/volume/
  fullscreen + keyboard shortcuts); `useDashPlayer` layers dash.js on top
  (quality / audio / subtitle tracks and trick-play thumbnails).
- The **My List** watchlist is client-only state in React Context, persisted to
  `localStorage`.

### Routes

| Path         | Page                                       |
| ------------ | ------------------------------------------ |
| `/`          | Home — search grid + watchlist (`?list=1`) |
| `/movie/:id` | Movie details + hero                       |
| `/watch/:id` | Immersive DASH player                      |
| `*`          | Not found                                  |

## Requirements

- **Node 18+** with npm.
- A running **ANIMUS API** with at least one `ready` title, otherwise the catalog
  is empty.

### Environment variables

Create `apps/client/.env` only if you need to override the default.

| Variable       | Default | Purpose                                                               |
| -------------- | ------- | --------------------------------------------------------------------- |
| `VITE_API_URL` | `/api`  | Base URL of the ANIMUS API (same-origin path; proxied to the backend) |

## Getting started

```bash
cd apps/client
npm install
npm run dev        # http://localhost:5173

npm run build      # type-check (tsc) + production build to dist/
npm run preview    # serve the production build locally
```

### Docker

A multi-stage Dockerfile builds the static site and serves it with nginx (SPA
history fallback). The API upstream is injected at startup from the
`API_UPSTREAM` env var (envsubst on `nginx.conf`).

## Project structure

```text
src/
├── animations/   # Framer Motion variants (page, card, player, overlay)
├── components/   # common/, layout/, movie/, player/ (folder-per-component + barrels)
├── constants/    # app title, player settings, storage keys
├── hooks/        # useMovie, useMovieSearch, usePlayer, useDashPlayer, useAsync, …
├── pages/        # HomePage, MovieDetailsPage, PlayerPage, NotFoundPage
├── services/     # apiClient, movieApi
├── store/        # WatchlistContext
├── types/        # Movie, ApiResponse, player + dash types
└── utils/        # cn, formatting helpers
```

## Credits

Movie metadata & artwork: [The Movie Database (TMDB)](https://www.themoviedb.org/).
This product uses the TMDB API but is not endorsed or certified by TMDB.
