from __future__ import annotations

from flask import request

from .errors import ApiError

# Soft admin flag (NOT authentication): the admin app sends this header. Replace
# with real auth (session/JWT) before production.
ADMIN_HEADER = "X-Admin-Request"
_TRUTHY = {"1", "true", "yes"}


def is_admin_request() -> bool:
    return request.headers.get(ADMIN_HEADER, "").strip().lower() in _TRUTHY


def require_admin() -> None:
    if not is_admin_request():
        raise ApiError("Admin access is required.", 403)
