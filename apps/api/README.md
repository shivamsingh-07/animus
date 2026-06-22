# ANIMUS API

The catalog service for ANIMUS. A Flask app that exposes the movie catalog over
HTTP and persists it to **MySQL** via SQLAlchemy. It also brokers video ingest:
it hands the admin presigned S3 upload URLs and enqueues an SQS transcode job
once a raw file is in place.

## How it works

The code is organised in layers, each with a single responsibility:

```text
routes -> services -> repositories -> models
             |
             +-- core/          cross-cutting helpers (envelope, errors, admin flag)
             +-- integrations/  external systems (S3, SQS, TMDB)
```

- **routes/** — thin Flask blueprints; parse the request, call a service, wrap
  the result in the response envelope.
- **services/** — validation, defaults, and business rules (e.g. enqueue a
  transcode job when a movie flips to `uploaded`; clean up S3 assets on delete).
- **repositories/** — the only layer that touches the database session.
- **models/** — the SQLAlchemy `Movie` model: short base62 string ids, the
  status enum, and serialization. `raw_s3_key` / `dash_s3_key` are internal; the
  player only ever receives `manifest_url`.
- **core/** — `ApiResponse` helpers, `ApiError` + error handlers, and the soft
  admin flag (`X-Admin-Request`).
- **integrations/** — S3 (presign + cleanup), SQS (enqueue jobs), TMDB (import).

Every response uses a shared envelope:

```jsonc
{ "success": true, "data": /* payload */ }
{ "success": false, "error": "message" }
```

The public client only sees titles with `status = ready`. The admin app sends an
`X-Admin-Request: true` header to see and manage every status. This is a soft
flag, **not** authentication — put real auth in front of it before production.

### Video ingest

1. The admin imports metadata (`GET /movies/import`) and requests an upload URL
   (`POST /uploads/presign`); the API creates or reuses a `created` catalog row.
2. The browser uploads the raw file straight to the S3 raw bucket with the
   presigned `PUT`.
3. The admin sets the movie to `uploaded`; the API enqueues an SQS transcode job.
4. The [transcode worker](../transcode/README.md) packages DASH and writes
   `manifest_url` + `status = ready` back to the database.

## Requirements

- **Python 3.10+** (the Docker image uses 3.14).
- A reachable **MySQL 8** database (local or AWS RDS). Tables are created on
  startup via `db.create_all()`, but the database/schema itself must already
  exist. There is no fallback — the app fails fast if MySQL isn't configured.
- AWS credentials + S3/SQS only if you exercise the upload pipeline; a TMDB
  token only if you use metadata import.

Python dependencies (`requirements.txt`): Flask, Flask-Cors, Flask-SQLAlchemy,
SQLAlchemy, PyMySQL, waitress, boto3, python-dotenv, requests.

### Environment variables

A local `apps/api/.env` is loaded automatically (python-dotenv).

**Server**

| Variable | Default | Purpose   |
| -------- | ------- | --------- |
| `PORT`   | `4000`  | HTTP port |

**Database (MySQL, required)**

| Variable             | Default | Purpose                                    |
| -------------------- | ------- | ------------------------------------------ |
| `MYSQL_HOST`         | —       | MySQL host (e.g. an RDS endpoint)          |
| `MYSQL_PORT`         | `3306`  | MySQL port                                 |
| `MYSQL_USER`         | `root`  | MySQL user                                 |
| `MYSQL_PASSWORD`     | —       | MySQL password                             |
| `MYSQL_DATABASE`     | —       | Database name                              |
| `MYSQL_SSL_DISABLED` | —       | Set `true` to force a plaintext connection |

**AWS S3 + SQS (upload pipeline)** — credentials resolve via the standard boto3
chain (the keys below, or an IAM role).

| Variable                  | Default             | Purpose                                   |
| ------------------------- | ------------------- | ----------------------------------------- |
| `S3_RAW_BUCKET`           | `animus-raw-files`  | Raw upload bucket                         |
| `S3_DASH_BUCKET`          | `animus-dash-files` | DASH output bucket (for delete cleanup)   |
| `S3_PRESIGN_EXPIRY`       | `3600`              | Presigned URL TTL (seconds)               |
| `AWS_REGION`              | `us-east-1`         | AWS region                                |
| `AWS_ACCESS_KEY_ID`       | —                   | AWS access key (or IAM role)              |
| `AWS_SECRET_ACCESS_KEY`   | —                   | AWS secret key (or IAM role)              |
| `AWS_ENDPOINT_URL`        | —                   | Custom S3/SQS endpoint (LocalStack/MinIO) |
| `SQS_TRANSCODE_QUEUE_URL` | —                   | Transcode queue; empty disables enqueue   |

**TMDB import (optional)**

| Variable            | Default                        | Purpose                        |
| ------------------- | ------------------------------ | ------------------------------ |
| `TMDB_ACCESS_TOKEN` | —                              | TMDB v4 read token (preferred) |
| `TMDB_API_KEY`      | —                              | TMDB v3 API key (fallback)     |
| `TMDB_API_BASE`     | `https://api.themoviedb.org/3` | TMDB API base URL              |
| `TMDB_IMAGE_BASE`   | `https://image.tmdb.org/t/p`   | TMDB image base URL            |

## Getting started

```bash
cd apps/api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# create .env with at least the MYSQL_* values, then:
python run.py            # serves http://127.0.0.1:4000 via waitress
```

`run.py` serves the app with **waitress**; set `ENV=development` for Flask's
debug server with auto-reload instead.

### Docker

A slim Dockerfile installs the dependencies and runs the same `run.py` (waitress
on port 4000).

```bash
cd apps/api
docker build -t animus-api .
docker run --rm -p 4000:4000 --env-file .env animus-api
```

## Endpoints

| Method | Path               | Description                                    |
| ------ | ------------------ | ---------------------------------------------- |
| GET    | `/health`          | Liveness check                                 |
| GET    | `/movies`          | List movies (public: `ready` only; admin: all) |
| GET    | `/movies/search`   | Search (`?q=`, `?genre=`, `?year=`)            |
| GET    | `/movies/import`   | Import TMDB metadata (`?url=`)                 |
| GET    | `/movies/<id>`     | Get one movie                                  |
| POST   | `/movies`          | Create a movie                                 |
| PUT    | `/movies/<id>`     | Update a movie                                 |
| DELETE | `/movies/<id>`     | Delete a movie (cleans up S3 assets)           |
| POST   | `/uploads/presign` | Presigned S3 upload URL (admin)                |

## Project structure

```text
apps/api/
├── app/
│   ├── __init__.py        # create_app() factory (CORS, db init, blueprints)
│   ├── config.py          # env-driven config
│   ├── extensions.py      # shared SQLAlchemy() instance
│   ├── core/              # envelope, errors, admin flag
│   ├── models/            # SQLAlchemy Movie model
│   ├── repositories/      # DB access
│   ├── services/          # validation, business rules, ingest orchestration
│   ├── routes/            # health, movies, uploads blueprints
│   └── integrations/      # s3, sqs, tmdb
├── run.py                 # dev entrypoint
└── requirements.txt
```

## Notes

- Schema is bootstrapped with `db.create_all()` — there is no migration tool
  yet, so plan for Alembic before evolving columns in production.
- The S3 raw bucket needs CORS allowing `PUT` from the admin origin
  (`http://localhost:5174` in dev). See [notes.md](../../notes.md) for the AWS
  setup.
