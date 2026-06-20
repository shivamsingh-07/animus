from __future__ import annotations

from flask import Blueprint, request
from flask.typing import ResponseReturnValue

from ..core.auth import require_admin
from ..core.responses import success
from ..services import upload_service

uploads_bp = Blueprint("uploads", __name__)


@uploads_bp.post("/uploads/presign")
def presign_upload() -> ResponseReturnValue:
    """Return a presigned URL the admin uses to upload a raw video to S3.

    Reuses an existing movie's upload slot when the same title/year is seen
    again, so re-importing doesn't create duplicate catalog entries.
    """
    require_admin()
    payload = request.get_json(silent=True) or {}
    title = str(payload.get("title", "")).strip() or "video"
    year = payload.get("year")
    return success(upload_service.create_upload(title, year if isinstance(year, int) else None))
