from __future__ import annotations

from typing import Any

from flask import jsonify
from flask.typing import ResponseReturnValue


def success(data: Any, status: int = 200) -> ResponseReturnValue:
    """Shared ApiResponse success envelope: ``{ "success": true, "data": ... }``."""
    return jsonify({"success": True, "data": data}), status


def failure(message: str, status: int = 400) -> ResponseReturnValue:
    """Shared ApiResponse error envelope: ``{ "success": false, "error": ... }``."""
    return jsonify({"success": False, "error": message}), status
