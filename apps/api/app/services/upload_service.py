from __future__ import annotations

from typing import Any, Optional

from ..integrations import s3
from ..repositories import movie_repository


def create_upload(title: str, year: Optional[int] = None) -> dict[str, Any]:
    """Presign an S3 upload for a raw movie file.

    If a movie with the same title (and year, when given) already exists, reuse
    its object key and id — so re-importing the same title later updates that
    entry instead of creating a duplicate.
    """
    existing = movie_repository.find_upload_by_title(title, year)
    if existing:
        key = existing.get("raw_s3_key") or s3.new_raw_key(title)
        return {**s3.presign_put(key), "movie_id": existing["id"], "existing": True}

    return {**s3.create_presigned_put(title), "movie_id": None, "existing": False}
