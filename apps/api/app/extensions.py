from __future__ import annotations

from flask_sqlalchemy import SQLAlchemy

# Shared extension instances live here so models, repositories and the app
# factory can import them without creating circular dependencies.
db = SQLAlchemy()
