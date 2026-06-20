from __future__ import annotations

from flask import Blueprint
from flask.typing import ResponseReturnValue

from ..core.responses import success

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health() -> ResponseReturnValue:
    return success({"status": "ok"})
