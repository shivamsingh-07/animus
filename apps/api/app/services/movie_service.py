from __future__ import annotations

from typing import Any, Optional

from ..core.errors import ApiError
from ..integrations import s3, sqs
from ..repositories import movie_repository


def list_movies(include_all: bool = False) -> list[dict]:
    return movie_repository.find_all(include_all=include_all)


def search_movies(
    query: Optional[str],
    genre: Optional[str],
    year: Optional[int],
    include_all: bool = False,
) -> list[dict]:
    return movie_repository.search(query, genre, year, include_all=include_all)


def get_movie(movie_id: str, include_all: bool = False) -> dict:
    movie = movie_repository.find_by_id(movie_id, include_all=include_all)
    if movie is None:
        raise ApiError.not_found(f'Movie with id "{movie_id}" was not found.')
    return movie


def create_movie(payload: dict[str, Any]) -> dict:
    _validate(payload, require_required=True)
    return movie_repository.create(_with_defaults(payload))


def update_movie(movie_id: str, patch: dict[str, Any]) -> dict:
    _validate(patch, require_required=False)
    updated = movie_repository.update(movie_id, patch)
    if updated is None:
        raise ApiError.not_found(f'Movie with id "{movie_id}" was not found.')
    # A completed raw upload (status -> 'uploaded') kicks off transcoding: enqueue
    # the job for the worker. Best-effort, so a queue hiccup won't fail the update.
    if patch.get("status") == "uploaded":
        job = movie_repository.find_job(movie_id)
        if job:
            sqs.enqueue_transcode(job["movie_id"], job["raw_s3_key"])
    return updated


def delete_movie(movie_id: str) -> None:
    keys = movie_repository.remove(movie_id)
    if keys is None:
        raise ApiError.not_found(f'Movie with id "{movie_id}" was not found.')
    s3.delete_movie_assets(keys.get("raw_s3_key"), keys.get("dash_s3_key"))


def _with_defaults(payload: dict[str, Any]) -> dict[str, Any]:
    """Fill fields the admin form may omit. A freshly uploaded title starts in
    `processing` until the transcoding pipeline produces a manifest and marks it
    `ready`."""
    movie = dict(payload)
    movie.setdefault("tagline", "")
    movie.setdefault("genres", [])
    movie.setdefault("maturity_rating", "NR")
    movie.setdefault("status", "created")
    return movie


def _validate(payload: dict[str, Any], *, require_required: bool) -> None:
    if require_required:
        if not str(payload.get("title", "")).strip():
            raise ApiError.bad_request("Title is required.")
        if not isinstance(payload.get("year"), int):
            raise ApiError.bad_request("Year is required.")
        if not str(payload.get("raw_s3_key", "")).strip():
            raise ApiError.bad_request("An uploaded video file is required.")

    year = payload.get("year")
    if year is not None and (not isinstance(year, int) or year < 1888 or year > 2100):
        raise ApiError.bad_request("Year must be between 1888 and 2100.")

    rating = payload.get("rating")
    if rating is not None and (not isinstance(rating, (int, float)) or rating < 0 or rating > 10):
        raise ApiError.bad_request("Rating must be between 0 and 10.")
