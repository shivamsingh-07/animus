from __future__ import annotations

import re
from typing import Any, Optional

import requests

from ..config import Config
from ..core.errors import ApiError

# Matches the numeric id in links like
# https://www.themoviedb.org/movie/27205-inception
_MOVIE_ID_RE = re.compile(r"/movie/(\d+)")
_POSTER_SIZE = "w500"
_BACKDROP_SIZE = "w1280"
_MAX_CAST = 6
_REQUEST_TIMEOUT = 10


def import_movie(url: str) -> dict[str, Any]:
    """Fetch a TMDB movie by link and map it to our movie-input shape."""
    movie_id = _extract_movie_id(url)
    raw = _request_movie(movie_id)
    return _map_movie(raw)


def _extract_movie_id(url: str) -> int:
    if not url or not url.strip():
        raise ApiError.bad_request("A TMDB movie link is required.")
    match = _MOVIE_ID_RE.search(url.strip())
    if not match:
        raise ApiError.bad_request(
            "Could not find a movie id in that link. Expected something like "
            "https://www.themoviedb.org/movie/27205-inception"
        )
    return int(match.group(1))


def _auth() -> tuple[dict[str, str], dict[str, str]]:
    """Build (headers, params) for TMDB auth, preferring a v4 bearer token."""
    if Config.TMDB_ACCESS_TOKEN:
        return {"Authorization": f"Bearer {Config.TMDB_ACCESS_TOKEN}"}, {}
    if Config.TMDB_API_KEY:
        return {}, {"api_key": Config.TMDB_API_KEY}
    raise ApiError(
        "TMDB credentials are not configured. Set TMDB_ACCESS_TOKEN or TMDB_API_KEY.",
        503,
    )


def _request_movie(movie_id: int) -> dict[str, Any]:
    headers, params = _auth()
    params = {**params, "append_to_response": "credits,release_dates,videos"}

    try:
        response = requests.get(
            f"{Config.TMDB_API_BASE}/movie/{movie_id}",
            headers=headers,
            params=params,
            timeout=_REQUEST_TIMEOUT,
        )
    except requests.RequestException:
        raise ApiError("Could not reach TMDB. Please try again.", 502)

    if response.status_code == 404:
        raise ApiError.not_found(f"TMDB has no movie with id {movie_id}.")
    if response.status_code in (401, 403):
        raise ApiError("TMDB rejected the configured credentials.", 502)
    if not response.ok:
        raise ApiError(f"TMDB request failed ({response.status_code}).", 502)

    return response.json()


def _map_movie(data: dict[str, Any]) -> dict[str, Any]:
    credits = data.get("credits") or {}
    cast = [member["name"] for member in (credits.get("cast") or [])[:_MAX_CAST] if member.get("name")]
    director = next(
        (
            member.get("name")
            for member in (credits.get("crew") or [])
            if member.get("job") == "Director" and member.get("name")
        ),
        "",
    )

    return {
        "title": data.get("title") or data.get("original_title") or "",
        "tagline": data.get("tagline") or "",
        "description": data.get("overview") or "",
        "year": _year(data.get("release_date")),
        "duration": _runtime(data.get("runtime")),
        "rating": round(float(data.get("vote_average") or 0), 1),
        "maturity_rating": _certification(data) or "NR",
        "genres": [g["name"] for g in (data.get("genres") or []) if g.get("name")],
        "poster": _image(data.get("poster_path"), _POSTER_SIZE),
        "backdrop": _image(data.get("backdrop_path"), _BACKDROP_SIZE),
        # TMDB does not provide a streamable source; the admin supplies this.
        "manifest_url": "",
        "trailer_url": _trailer(data.get("videos")),
        "cast_members": cast,
        "director": director,
        "language": _language(data),
    }


def _year(release_date: Optional[str]) -> Optional[int]:
    if release_date and len(release_date) >= 4 and release_date[:4].isdigit():
        return int(release_date[:4])
    return None


def _runtime(minutes: Any) -> str:
    if not isinstance(minutes, int) or minutes <= 0:
        return ""
    hours, mins = divmod(minutes, 60)
    if hours and mins:
        return f"{hours}h {mins}m"
    return f"{hours}h" if hours else f"{mins}m"


def _image(path: Optional[str], size: str) -> str:
    return f"{Config.TMDB_IMAGE_BASE}/{size}{path}" if path else ""


def _trailer(videos: Optional[dict[str, Any]]) -> str:
    results = [
        video for video in ((videos or {}).get("results") or []) if video.get("site") == "YouTube" and video.get("key")
    ]
    if not results:
        return ""
    # Prefer official trailers.
    results.sort(
        key=lambda video: (video.get("type") == "Trailer", bool(video.get("official"))),
        reverse=True,
    )
    return f"https://www.youtube.com/watch?v={results[0]['key']}"


def _certification(data: dict[str, Any]) -> str:
    results = (data.get("release_dates") or {}).get("results") or []
    us = next((entry for entry in results if entry.get("iso_3166_1") == "US"), None)
    if not us:
        return ""
    for release in us.get("release_dates") or []:
        if release.get("certification"):
            return release["certification"]
    return ""


def _language(data: dict[str, Any]) -> str:
    spoken = data.get("spoken_languages") or []
    if spoken and spoken[0].get("english_name"):
        return spoken[0]["english_name"]
    return "English"
