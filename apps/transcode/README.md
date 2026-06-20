# ANIMUS Transcode Worker

A standalone, containerized worker that turns a raw upload into a streamable
**DASH** package. It long-polls an **SQS** queue for jobs and never calls the
API: for each job it pulls the source from S3, transcodes and packages it, uploads
the output back to S3, and writes the movie's status + manifest URL **directly to
the shared MySQL catalog**.

## How it works

```text
SQS message: [{ movie_id, raw_s3_key }]
   │ receive (long poll)              -> status = processing
   ▼
   │ download s3://<raw-bucket>/<raw_s3_key>
   ▼
scripts/convert.sh   FFmpeg: 1080p/720p/480p H.264 renditions, AAC stereo audio
                     per language, WebVTT subtitles, JPEG thumbnail tiles
   ▼
scripts/package.sh   Bento4: mp4fragment + mp4dash -> manifest.mpd + segments
   ▼
   │ upload output/ -> s3://<dash-bucket>/<movie_id>/
   ▼
UPDATE movies SET status='ready', manifest_url=…, dash_s3_key=…   (direct SQL)
   ▼
   │ delete the SQS message (only if every job in it succeeded)
```

A message body is a JSON array of jobs, e.g.
`[{ "movie_id": "abc123", "raw_s3_key": "abc123-inception.mp4" }]`. Each job runs
through `process_job()`; the message is deleted only when **all** of them
succeed, so a failure stays on the queue and is redelivered after the visibility
timeout (point a dead-letter queue at it for poison jobs). `status` moves
`processing` (at receive) -> `ready` on success, or `failed` on error.

This worker owns no schema — it writes to the same `movies` table the
[API](../api/README.md) defines, so its status values and column names must stay
in sync with the API's model.

## Requirements

- **FFmpeg / ffprobe** and **Bento4** (`mp4fragment`, `mp4dash`) on `PATH`. The
  Docker image installs both; for local runs provide them yourself and set
  `BENTO4_BIN`.
- **Python 3.10+** (the image uses 3.12). Dependencies (`requirements.txt`):
  boto3, SQLAlchemy, PyMySQL, python-dotenv.
- Access to the shared **MySQL** catalog, the **S3** raw + DASH buckets, and the
  **SQS** queue.

### Environment variables

A local `.env` is loaded automatically (python-dotenv); in Docker the
environment comes from `--env-file`/`-e`.

| Variable                                                                         | Default             | Purpose                                                               |
| -------------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------- |
| `SQS_QUEUE_URL`                                                                  | —                   | **Required.** Queue the worker long-polls for jobs                    |
| `SQS_WAIT_SECONDS`                                                               | `20`                | Long-poll wait per receive (max 20)                                   |
| `MYSQL_HOST` / `MYSQL_PORT` / `MYSQL_USER` / `MYSQL_PASSWORD` / `MYSQL_DATABASE` | —                   | Shared catalog DB (or set `DATABASE_URL` instead)                     |
| `DATABASE_URL`                                                                   | —                   | Full SQLAlchemy URL; overrides the `MYSQL_*` parts                    |
| `MYSQL_SSL_DISABLED`                                                             | —                   | Set `true` to force a plaintext connection                            |
| `S3_RAW_BUCKET`                                                                  | `animus-raw-files`  | Source uploads                                                        |
| `S3_DASH_BUCKET`                                                                 | `animus-dash-files` | Packaged DASH output                                                  |
| `DASH_PUBLIC_BASE_URL`                                                           | derived             | Public base the player fetches the manifest from (CloudFront in prod) |
| `AWS_REGION`                                                                     | `us-east-1`         | AWS region                                                            |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`                                    | —                   | Standard boto3 chain (IRSA on EKS later)                              |
| `AWS_ENDPOINT_URL`                                                               | —                   | Custom endpoint for all AWS calls (LocalStack/MinIO)                  |
| `BENTO4_BIN`                                                                     | `/opt/bento4/bin`   | Bento4 binaries (set by the image)                                    |

## Build & run

```bash
cd apps/transcode
docker build -t animus-transcode .

# long-poll SQS_QUEUE_URL for jobs
docker run --rm --env-file .env animus-transcode
```

Locally without Docker (needs `ffmpeg` + Bento4 on `PATH` and `BENTO4_BIN` set):

```bash
pip install -r requirements.txt
python worker.py        # polls SQS_QUEUE_URL
```

To pin a different Bento4 build, pass `--build-arg BENTO4_URL=…` to `docker build`.

## Project structure

```text
apps/transcode/
├── worker.py          # SQS poller: fetch S3 -> run scripts -> upload DASH -> mark ready
├── scripts/
│   ├── convert.sh     # FFmpeg renditions + audio/subtitles/thumbnails
│   └── package.sh     # Bento4 DASH packaging (manifest.mpd + segments)
├── Dockerfile         # python:3.12-slim + ffmpeg + Bento4
└── requirements.txt   # boto3, SQLAlchemy, PyMySQL, python-dotenv
```

## Notes

- **No API calls.** Results are written straight to the `movies` table, so the
  worker needs DB access and must track the API's status enum.
- **Auth:** boto3's default credential chain — env keys now, IRSA on EKS later
  (no code change). See [notes.md](../../notes.md) for the AWS setup.
- **Retries:** a message is deleted only after every job in it succeeds; set the
  queue's `VisibilityTimeout` longer than a transcode takes and attach a DLQ so a
  poison job doesn't loop forever.
- The DASH bucket needs CORS allowing `GET`/`HEAD` from the client origin if the
  player streams from it directly (rather than via CloudFront).
```

