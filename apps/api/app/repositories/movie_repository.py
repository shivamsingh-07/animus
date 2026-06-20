from __future__ import annotations

from typing import Any, Optional

from sqlalchemy import func, select

from ..extensions import db
from ..models import READY_STATUS, Movie

MovieDict = dict[str, Any]


class MovieRepository:
    """
    SQLAlchemy-backed persistence — the single place that touches the database.
    Everything above it (service, routes) works purely with plain movie dicts,
    so swapping or extending the storage layer leaves them untouched.
    """

    def find_all(self, include_all: bool = False) -> list[MovieDict]:
        stmt = select(Movie).order_by(Movie.created_at, Movie.id)
        if not include_all:
            stmt = stmt.where(Movie.status == READY_STATUS)
        return [m.to_dict() for m in db.session.scalars(stmt).all()]

    def find_by_id(self, movie_id: str, include_all: bool = False) -> Optional[MovieDict]:
        movie = db.session.get(Movie, movie_id)
        if movie is None or (not include_all and movie.status != READY_STATUS):
            return None
        return movie.to_dict()

    def find_upload_by_title(self, title: str, year: Optional[int] = None) -> Optional[dict]:
        """Locate an existing movie by title (and year, if given) so a re-upload
        reuses the same entry + object key instead of creating a duplicate.
        Returns the internal id + raw key, not the public movie shape."""
        cleaned = (title or "").strip().lower()
        if not cleaned:
            return None
        stmt = select(Movie).where(func.lower(Movie.title) == cleaned)
        if year is not None:
            stmt = stmt.where(Movie.year == year)
        movie = db.session.scalars(stmt.order_by(Movie.created_at.desc())).first()
        if movie is None:
            return None
        return {"id": movie.id, "raw_s3_key": movie.raw_s3_key}

    def find_job(self, movie_id: str) -> Optional[dict]:
        """Return the transcode job shape ``{movie_id, raw_s3_key}`` for a movie,
        or None if it's missing or has no raw upload yet."""
        record = db.session.get(Movie, movie_id)
        if record is None or not record.raw_s3_key:
            return None
        return {"movie_id": record.id, "raw_s3_key": record.raw_s3_key}

    def search(
        self,
        query: Optional[str],
        genre: Optional[str],
        year: Optional[int],
        include_all: bool = False,
    ) -> list[MovieDict]:
        # `year` narrows in SQL; genre/free-text are matched in Python so the
        # case-insensitive, multi-field behaviour matches the catalog exactly.
        stmt = select(Movie).order_by(Movie.created_at, Movie.id)
        if not include_all:
            stmt = stmt.where(Movie.status == READY_STATUS)
        if year is not None:
            stmt = stmt.where(Movie.year == year)

        normalized = (query or "").strip().lower()
        results: list[MovieDict] = []
        for movie in db.session.scalars(stmt).all():
            genres = movie.genres or []
            if genre and not any(g.lower() == genre.lower() for g in genres):
                continue
            if normalized:
                haystack = " ".join(
                    [
                        movie.title or "",
                        movie.director or "",
                        movie.tagline or "",
                        *(movie.cast_members or []),
                        *genres,
                    ]
                ).lower()
                if normalized not in haystack:
                    continue
            results.append(movie.to_dict())
        return results

    def create(self, movie: MovieDict) -> MovieDict:
        record = Movie().apply(movie)
        db.session.add(record)
        db.session.commit()
        return record.to_dict()

    def update(self, movie_id: str, patch: MovieDict) -> Optional[MovieDict]:
        record = db.session.get(Movie, movie_id)
        if record is None:
            return None
        record.apply(patch)
        db.session.commit()
        return record.to_dict()

    def remove(self, movie_id: str) -> Optional[dict]:
        """Delete the movie and return its S3 keys (for cleanup), or None if it
        didn't exist."""
        record = db.session.get(Movie, movie_id)
        if record is None:
            return None
        keys = {"raw_s3_key": record.raw_s3_key, "dash_s3_key": record.dash_s3_key}
        db.session.delete(record)
        db.session.commit()
        return keys


movie_repository = MovieRepository()
