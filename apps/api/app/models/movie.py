from __future__ import annotations

import secrets
import string
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import JSON
from sqlalchemy import Enum as SqlEnum

from ..extensions import db

MOVIE_STATUSES = ("created", "uploaded", "processing", "ready", "failed")
# Only titles in this state are visible to the public client.
READY_STATUS = "ready"

# Short, URL-friendly public ids (base62). At length 10 that's ~8.4e17
# combinations, so collisions are effectively impossible at catalog scale.
ID_ALPHABET = string.ascii_letters + string.digits
ID_LENGTH = 10

# Columns the API never sets from a request payload (server-managed).
_READ_ONLY_FIELDS = frozenset({"id", "created_at", "updated_at"})

# Internal columns: settable on write (e.g. by the pipeline) but never serialized
# back to API consumers.
_PRIVATE_FIELDS = frozenset({"raw_s3_key", "dash_s3_key"})


def generate_id() -> str:
    return "".join(secrets.choice(ID_ALPHABET) for _ in range(ID_LENGTH))


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Movie(db.Model):
    __tablename__ = "movies"

    id = db.Column(db.String(ID_LENGTH), primary_key=True, default=generate_id)

    # --- catalog metadata ---
    title = db.Column(db.String(255), nullable=False, default="")
    tagline = db.Column(db.String(512), nullable=False, default="")
    description = db.Column(db.Text, nullable=False, default="")
    year = db.Column(db.Integer)
    duration = db.Column(db.String(32), nullable=False, default="")
    rating = db.Column(db.Float, nullable=False, default=0.0)
    maturity_rating = db.Column(db.String(16), nullable=False, default="NR")
    genres = db.Column(JSON, nullable=False, default=list)
    cast_members = db.Column(JSON, nullable=False, default=list)
    director = db.Column(db.String(255), nullable=False, default="")
    language = db.Column(db.String(64), nullable=False, default="English")
    poster = db.Column(db.Text, nullable=False, default="")
    backdrop = db.Column(db.Text, nullable=False, default="")
    trailer_url = db.Column(db.Text, nullable=False, default="")

    # --- video pipeline ---
    status = db.Column(
        SqlEnum(*MOVIE_STATUSES, name="movie_status"), nullable=False, default="ready"
    )
    raw_s3_key = db.Column(db.Text)
    dash_s3_key = db.Column(db.Text)
    # CloudFront URL to the .mpd the player streams.
    manifest_url = db.Column(db.Text, nullable=False, default="")

    created_at = db.Column(db.DateTime, nullable=False, default=_now)
    updated_at = db.Column(db.DateTime, nullable=False, default=_now, onupdate=_now)

    def to_dict(self) -> dict[str, Any]:
        """Serialize columns to JSON (keys are the column names). Private pipeline
        columns (the S3 keys) are never emitted to API consumers."""
        result: dict[str, Any] = {}
        for column in self.__table__.columns:
            if column.name in _PRIVATE_FIELDS:
                continue
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                if value.tzinfo is None:
                    value = value.replace(tzinfo=timezone.utc)
                value = value.isoformat()
            result[column.name] = value
        return result

    def apply(self, payload: dict[str, Any]) -> "Movie":
        """Assign any provided columns from the payload (keys map 1:1 to columns)."""
        for column in self.__table__.columns:
            if column.name not in _READ_ONLY_FIELDS and column.name in payload:
                setattr(self, column.name, payload[column.name])
        return self
