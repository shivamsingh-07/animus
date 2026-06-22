from __future__ import annotations

import os
from urllib.parse import quote_plus

from dotenv import load_dotenv

load_dotenv()


def _database_uri() -> str:
    host = os.environ.get("MYSQL_HOST")
    database = os.environ.get("MYSQL_DATABASE")
    user = os.environ.get("MYSQL_USER", "root")
    password = quote_plus(os.environ.get("MYSQL_PASSWORD", ""))
    port = os.environ.get("MYSQL_PORT", "3306")
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}?charset=utf8mb4"


def _engine_options() -> dict:
    options: dict = {"pool_pre_ping": True}
    if os.environ.get("MYSQL_SSL_DISABLED", "").lower() in ("1", "true", "yes"):
        options["connect_args"] = {"ssl_disabled": True}
    return options


class Config:
    PORT: int = int(os.environ.get("PORT", "4000"))
    DEBUG: bool = os.environ.get("FLASK_DEBUG", "0") == "1"

    SQLALCHEMY_DATABASE_URI: str = _database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False
    SQLALCHEMY_ENGINE_OPTIONS: dict = _engine_options()

    S3_RAW_BUCKET: str = os.environ.get("S3_RAW_BUCKET", "animus-raw-files")
    S3_DASH_BUCKET: str = os.environ.get("S3_DASH_BUCKET", "animus-dash-files")
    AWS_REGION: str = os.environ.get("AWS_REGION", "us-east-1")
    S3_PRESIGN_EXPIRY: int = int(os.environ.get("S3_PRESIGN_EXPIRY", "3600"))
    AWS_ENDPOINT_URL: str = os.environ.get("AWS_ENDPOINT_URL", "")

    SQS_TRANSCODE_QUEUE_URL: str = os.environ.get("SQS_TRANSCODE_QUEUE_URL", "")

    TMDB_ACCESS_TOKEN: str = os.environ.get("TMDB_ACCESS_TOKEN", "")
    TMDB_API_KEY: str = os.environ.get("TMDB_API_KEY", "")
    TMDB_API_BASE: str = os.environ.get("TMDB_API_BASE", "https://api.themoviedb.org/3")
    TMDB_IMAGE_BASE: str = os.environ.get("TMDB_IMAGE_BASE", "https://image.tmdb.org/t/p")
