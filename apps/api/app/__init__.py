from __future__ import annotations

from flask import Flask
from flask_cors import CORS

from .config import Config
from .core import register_error_handlers
from .extensions import db
from .routes import health_bp, movies_bp, uploads_bp


def create_app(config: type[Config] = Config) -> Flask:
    """Application factory: build a configured Flask app bound to the database."""
    app = Flask(__name__)
    app.config.from_object(config)
    app.json.sort_keys = False  # preserve movie field order in responses

    CORS(app)
    db.init_app(app)

    with app.app_context():
        db.create_all()

    app.register_blueprint(health_bp)
    app.register_blueprint(movies_bp)
    app.register_blueprint(uploads_bp)
    register_error_handlers(app)

    return app
