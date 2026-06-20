from __future__ import annotations

from flask import Blueprint, request
from flask.typing import ResponseReturnValue

from ..core.auth import is_admin_request
from ..core.responses import success
from ..integrations import tmdb
from ..services import movie_service

movies_bp = Blueprint("movies", __name__)


@movies_bp.get("/movies")
def get_movies() -> ResponseReturnValue:
    return success(movie_service.list_movies(include_all=is_admin_request()))


@movies_bp.get("/movies/search")
def search_movies() -> ResponseReturnValue:
    year_arg = request.args.get("year")
    year = int(year_arg) if year_arg and year_arg.isdigit() else None
    return success(
        movie_service.search_movies(
            request.args.get("q"),
            request.args.get("genre"),
            year,
            include_all=is_admin_request(),
        )
    )


@movies_bp.get("/movies/import")
def import_movie() -> ResponseReturnValue:
    return success(tmdb.import_movie(request.args.get("url", "")))


@movies_bp.get("/movies/<movie_id>")
def get_movie(movie_id: str) -> ResponseReturnValue:
    return success(movie_service.get_movie(movie_id, include_all=is_admin_request()))


@movies_bp.post("/movies")
def create_movie() -> ResponseReturnValue:
    payload = request.get_json(silent=True) or {}
    return success(movie_service.create_movie(payload), 201)


@movies_bp.put("/movies/<movie_id>")
def update_movie(movie_id: str) -> ResponseReturnValue:
    payload = request.get_json(silent=True) or {}
    return success(movie_service.update_movie(movie_id, payload), 200)


@movies_bp.delete("/movies/<movie_id>")
def delete_movie(movie_id: str) -> ResponseReturnValue:
    movie_service.delete_movie(movie_id)
    return success({"id": movie_id})
