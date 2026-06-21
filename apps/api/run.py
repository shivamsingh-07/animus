import logging
import os

from app import create_app
from app.config import Config
from waitress import serve

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("animus.api")

app = create_app()

if __name__ == "__main__":
    if os.environ.get("ENV") == "development":
        app.run(host="0.0.0.0", port=Config.PORT, debug=True)
    else:
        logger.info("Animus API on port %s via waitress", Config.PORT)
        serve(app, host="0.0.0.0", port=Config.PORT)
