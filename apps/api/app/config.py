from __future__ import annotations

import os
from urllib.parse import quote_plus

from dotenv import load_dotenv

load_dotenv()


def _database_uri() -> str:
    """Compose the MySQL connection URL from the ``MYSQL_*`` environment variables."""
    host = os.environ.get("MYSQL_HOST")
    database = os.environ.get("MYSQL_DATABASE")
    if not (host and database):
        raise RuntimeError(
            "Database is not configured. Set MYSQL_HOST, MYSQL_DATABASE, "
            "MYSQL_USER and MYSQL_PASSWORD (see apps/api/.env.example)."
        )

    user = os.environ.get("MYSQL_USER", "root")
    password = quote_plus(os.environ.get("MYSQL_PASSWORD", ""))
    port = os.environ.get("MYSQL_PORT", "3306")
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}?charset=utf8mb4"


def _engine_options() -> dict:
    """SQLAlchemy engine options. ``MYSQL_SSL_DISABLED`` forces a plaintext MySQL
    connection (the equivalent of ``mysql --ssl-mode=DISABLED``) for dev servers
    that advertise TLS but can't complete the handshake."""
    options: dict = {"pool_pre_ping": True}
    if os.environ.get("MYSQL_SSL_DISABLED", "").lower() in ("1", "true", "yes"):
        options["connect_args"] = {"ssl_disabled": True}
    return options


class Config:
    """Application configuration sourced from the environment."""

    PORT: int = int(os.environ.get("PORT", "4000"))
    DEBUG: bool = os.environ.get("FLASK_DEBUG", "0") == "1"

    # Database (MySQL)
    SQLALCHEMY_DATABASE_URI: str = _database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False
    # pool_pre_ping keeps long-lived MySQL connections from going stale.
    SQLALCHEMY_ENGINE_OPTIONS: dict = _engine_options()

    # AWS S3. Credentials are resolved by the standard AWS chain —
    # AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY env vars, or an IAM role.
    S3_RAW_BUCKET: str = os.environ.get("S3_RAW_BUCKET", "animus-raw-files")
    S3_DASH_BUCKET: str = os.environ.get("S3_DASH_BUCKET", "animus-dash-files")
    AWS_REGION: str = os.environ.get("AWS_REGION", "us-east-1")
    S3_PRESIGN_EXPIRY: int = int(os.environ.get("S3_PRESIGN_EXPIRY", "3600"))
    # Optional custom endpoint for all AWS calls (S3 + SQS), e.g. LocalStack:
    # http://localhost:4566. Leave unset for real AWS.
    AWS_ENDPOINT_URL: str = os.environ.get("AWS_ENDPOINT_URL", "")

    # SQS — transcode jobs. When set, the API enqueues a job once a raw upload
    # completes (status -> 'uploaded'); empty disables enqueueing.
    SQS_TRANSCODE_QUEUE_URL: str = os.environ.get("SQS_TRANSCODE_QUEUE_URL", "")

    # TMDB integration (server-side so the key never reaches the browser).
    # Prefer a v4 read access token; otherwise a v3 api key is used.
    TMDB_ACCESS_TOKEN: str = os.environ.get("TMDB_ACCESS_TOKEN", "")
    TMDB_API_KEY: str = os.environ.get("TMDB_API_KEY", "")
    TMDB_API_BASE: str = os.environ.get("TMDB_API_BASE", "https://api.themoviedb.org/3")
    TMDB_IMAGE_BASE: str = os.environ.get("TMDB_IMAGE_BASE", "https://image.tmdb.org/t/p")
