import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.router import api_router
from .core.logging import setup_logging
from .db import init_db


setup_logging()
logger = logging.getLogger("app")


def create_app() -> FastAPI:
    app = FastAPI(title="PersonaForge", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_router, prefix="/api")

    @app.on_event("startup")
    def on_startup() -> None:
        init_db()
        logger.info("PersonaForge backend started")

    return app


app = create_app()
