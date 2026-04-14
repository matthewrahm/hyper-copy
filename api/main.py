import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from hyper_copy.leaderboard import LeaderboardManager
from api.routes import router

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


async def _periodic_refresh(app: FastAPI):
    """Refresh all trader scores every 30 minutes."""
    while True:
        await asyncio.sleep(30 * 60)
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, app.state.manager.refresh_all)
            logger.info("Periodic refresh complete")
        except Exception as e:
            logger.error(f"Periodic refresh failed: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting LeaderboardManager...")
    app.state.manager = LeaderboardManager()
    app.state.manager.seed()

    # Start periodic refresh in background
    task = asyncio.create_task(_periodic_refresh(app))
    yield
    task.cancel()
    app.state.manager.db.close()
    logger.info("Shutdown complete")


app = FastAPI(
    title="hyper-copy",
    description="Hyperliquid copy trading platform API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
