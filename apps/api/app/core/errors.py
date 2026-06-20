from __future__ import annotations

from flask import Flask
from werkzeug.exceptions import HTTPException

from .responses import failure


class ApiError(Exception):
    """Domain error carrying an HTTP status, mapped to the error envelope."""

    def __init__(self, message: str, status: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status = status

    @classmethod
    def not_found(cls, message: str = "Resource not found") -> "ApiError":
        return cls(message, 404)

    @classmethod
    def bad_request(cls, message: str = "Invalid request") -> "ApiError":
        return cls(message, 400)


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(ApiError)
    def _handle_api_error(err: ApiError) -> object:
        return failure(err.message, err.status)

    @app.errorhandler(HTTPException)
    def _handle_http_error(err: HTTPException) -> object:
        return failure(err.description or err.name, err.code or 500)

    @app.errorhandler(Exception)
    def _handle_unexpected(err: Exception) -> object:
        app.logger.exception(err)
        return failure("Unexpected server error.", 500)
