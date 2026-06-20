#!/usr/bin/env python3
"""ANIMUS transcoder — DASH packager.

The worker long-polls an **SQS queue** for jobs. For each message it:
  1. fetches the raw upload from S3 (by ``raw_s3_key``),
  2. encodes renditions + extracts audio / subtitles / thumbnails (FFmpeg),
  3. packages a DASH manifest with Bento4,
  4. uploads the result to ``s3://<dash-bucket>/<movie_id>/``,
  5. updates the movie row **directly in the database** — ``processing`` at start,
     then ``ready`` (with manifest_url + dash_s3_key) on success, or ``failed``,
  6. deletes the SQS message — but only after the job succeeds, so a failed job
     is redelivered after the queue's visibility timeout (or sent to a DLQ).

A message body is a JSON array of jobs, e.g. ``[{"movie_id", "raw_s3_key"}]``.
The worker never calls the API.

AWS auth uses the default boto3 chain (env now; IRSA on EKS later).
"""

from __future__ import annotations

import datetime as dt
import json
import os
import subprocess
import tempfile
from pathlib import Path
from urllib.parse import quote_plus

import boto3
from botocore.config import Config as BotoConfig
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load a local .env for non-container runs (no-op in Docker, where the
# environment comes from --env-file / -e).
load_dotenv()

AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
# Custom endpoint for all AWS calls — LocalStack/MinIO; leave unset for real AWS.
AWS_ENDPOINT_URL = os.environ.get("AWS_ENDPOINT_URL") or None
RAW_BUCKET = os.environ.get("S3_RAW_BUCKET", "animus-raw-files")
DASH_BUCKET = os.environ.get("S3_DASH_BUCKET", "animus-dash-files")
BENTO4_BIN = os.environ.get("BENTO4_BIN", "/opt/bento4/bin")

# SQS (job source).
SQS_QUEUE_URL = os.environ.get("SQS_QUEUE_URL") or None
SQS_WAIT_SECONDS = int(os.environ.get("SQS_WAIT_SECONDS", "20"))  # long-poll wait

SCRIPTS = Path(__file__).resolve().parent / "scripts"

# Content types so S3/CloudFront serve the manifest + segments correctly.
_CONTENT_TYPES = {
    ".mpd": "application/dash+xml",
    ".m4s": "video/iso.segment",
    ".mp4": "video/mp4",
    ".m4a": "audio/mp4",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".vtt": "text/vtt",
}


def _default_dash_base() -> str:
    if AWS_ENDPOINT_URL:  # LocalStack / MinIO: path-style public URL
        return f"{AWS_ENDPOINT_URL.rstrip('/')}/{DASH_BUCKET}"
    return f"https://{DASH_BUCKET}.s3.{AWS_REGION}.amazonaws.com"


# Public base the player fetches the manifest from (a CloudFront domain in prod).
DASH_PUBLIC_BASE_URL = (os.environ.get("DASH_PUBLIC_BASE_URL") or _default_dash_base()).rstrip("/")


def _database_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if url:
        return url
    user = os.environ.get("MYSQL_USER", "")
    password = quote_plus(os.environ.get("MYSQL_PASSWORD", ""))
    host = os.environ.get("MYSQL_HOST", "127.0.0.1")
    port = os.environ.get("MYSQL_PORT", "3306")
    database = os.environ.get("MYSQL_DATABASE", "animus")
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}?charset=utf8mb4"


def _connect_args() -> dict:
    # MYSQL_SSL_DISABLED forces a plaintext connection (mirrors
    # `mysql --ssl-mode=DISABLED`) for dev servers with broken/absent TLS.
    if os.environ.get("MYSQL_SSL_DISABLED", "").lower() in ("1", "true", "yes"):
        return {"ssl_disabled": True}
    return {}


engine = create_engine(_database_url(), pool_pre_ping=True, connect_args=_connect_args())


def _s3_client():
    kwargs: dict = {"region_name": AWS_REGION}
    if AWS_ENDPOINT_URL:  # LocalStack / MinIO — path-style keeps the bucket in the path
        kwargs["endpoint_url"] = AWS_ENDPOINT_URL
        kwargs["config"] = BotoConfig(s3={"addressing_style": "path"})
    return boto3.client("s3", **kwargs)


def _sqs_client():
    kwargs: dict = {"region_name": AWS_REGION}
    if AWS_ENDPOINT_URL:  # LocalStack / ElasticMQ
        kwargs["endpoint_url"] = AWS_ENDPOINT_URL
    return boto3.client("sqs", **kwargs)


s3 = _s3_client()
sqs = _sqs_client()


def _now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc).replace(tzinfo=None)


def _set_status(movie_id: str, **fields: str) -> None:
    """Write the movie's status (+ optional manifest_url / dash_s3_key) straight
    to the DB. Column names come from code (not request input), so interpolating
    them is safe; values are bound parameters."""
    fields["updated_at"] = _now()
    assignments = ", ".join(f"{column} = :{column}" for column in fields)
    try:
        with engine.begin() as conn:
            conn.execute(
                text(f"UPDATE movies SET {assignments} WHERE id = :movie_id"),
                {**fields, "movie_id": movie_id},
            )
    except Exception as exc:  # noqa: BLE001
        print(f"[{movie_id}] db update failed ({fields}): {exc}", flush=True)


def _run(script: str, *args: str, cwd: Path) -> None:
    env = {**os.environ, "BENTO4_BIN": BENTO4_BIN}
    subprocess.run(["bash", str(SCRIPTS / script), *args], cwd=str(cwd), env=env, check=True)


def _upload_output(local_dir: Path, prefix: str) -> None:
    for path in sorted(local_dir.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(local_dir).as_posix()
        ctype = _CONTENT_TYPES.get(path.suffix.lower(), "application/octet-stream")
        s3.upload_file(str(path), DASH_BUCKET, f"{prefix}/{rel}", ExtraArgs={"ContentType": ctype})


def process_job(movie_id: str, raw_s3_key: str) -> None:
    """Transcode one raw upload to DASH, publish it, and mark the movie ready."""
    if not movie_id or not raw_s3_key:
        raise ValueError("job requires both movie_id and raw_s3_key")

    print(f"[{movie_id}] start (raw={raw_s3_key})", flush=True)
    _set_status(movie_id, status="processing")

    with tempfile.TemporaryDirectory(prefix="animus-") as tmp:
        work = Path(tmp)
        source = work / "source"
        s3.download_file(RAW_BUCKET, raw_s3_key, str(source))

        _run("convert.sh", str(source), cwd=work)
        _run("package.sh", cwd=work)

        # The DASH output lives under the movie id (its dash_s3_key prefix).
        _upload_output(work / "output", movie_id)

    manifest_url = f"{DASH_PUBLIC_BASE_URL}/{movie_id}/manifest.mpd"
    _set_status(movie_id, status="ready", manifest_url=manifest_url, dash_s3_key=movie_id)
    print(f"[{movie_id}] ready -> {manifest_url}", flush=True)


def _jobs_from_body(body: str) -> list[dict]:
    """Parse an SQS message body — a single job object or a JSON array of them."""
    data = json.loads(body)
    if isinstance(data, dict):
        return [data]
    if isinstance(data, list):
        return data
    raise ValueError("message body must be a job object or an array")


def _handle_message(message: dict) -> None:
    """Process one SQS message; delete it only if every job succeeds."""
    receipt = message["ReceiptHandle"]
    try:
        jobs = _jobs_from_body(message.get("Body", ""))
    except (ValueError, TypeError) as exc:
        # Poison message: drop it so it can't block the queue forever.
        print(f"[worker] dropping malformed message: {exc}", flush=True)
        sqs.delete_message(QueueUrl=SQS_QUEUE_URL, ReceiptHandle=receipt)
        return

    failures = 0
    for job in jobs:
        movie_id = job.get("movie_id", "")
        try:
            process_job(movie_id, job.get("raw_s3_key", ""))
        except Exception as exc:  # noqa: BLE001 — mark failed, keep going
            failures += 1
            print(f"[{movie_id}] FAILED: {exc}", flush=True)
            if movie_id:
                _set_status(movie_id, status="failed")

    if failures:
        # Leave it on the queue: SQS redelivers after the visibility timeout
        # (configure a DLQ for poison jobs).
        print("[worker] job(s) failed — leaving message for redelivery", flush=True)
        return

    sqs.delete_message(QueueUrl=SQS_QUEUE_URL, ReceiptHandle=receipt)
    print("[worker] message deleted", flush=True)


def poll_queue() -> None:
    """Long-poll SQS forever, handling one message at a time."""
    if not SQS_QUEUE_URL:
        raise SystemExit("SQS_QUEUE_URL is not set — nothing to poll.")
    print(f"[worker] polling {SQS_QUEUE_URL}", flush=True)
    while True:
        response = sqs.receive_message(
            QueueUrl=SQS_QUEUE_URL,
            MaxNumberOfMessages=1,
            WaitTimeSeconds=SQS_WAIT_SECONDS,
        )
        for message in response.get("Messages", []):
            _handle_message(message)


if __name__ == "__main__":
    poll_queue()
