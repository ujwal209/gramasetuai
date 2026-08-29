import os
import logging
from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger(__name__)

_mongo_client: Optional[AsyncIOMotorClient] = None
_mongo_available: Optional[bool] = None

# In-memory document collection fallback if Atlas credentials fail
_in_memory_users: Dict[str, Dict[str, Any]] = {}


def get_mongo_uri() -> str:
    return (
        os.environ.get("MONGO_DB_URI")
        or settings.MONGO_DB_URI
        or "mongodb+srv://u00573684_db_user:u00573684_db_user@c1.ddrjz7l.mongodb.net/"
    ).strip()


def get_mongo_client() -> Optional[AsyncIOMotorClient]:
    global _mongo_client
    if _mongo_client is None:
        uri = get_mongo_uri()
        try:
            _mongo_client = AsyncIOMotorClient(
                uri,
                serverSelectionTimeoutMS=3000,
                connectTimeoutMS=3000,
            )
        except Exception as e:
            logger.warning(f"Failed to create MongoDB client: {e}")
            _mongo_client = None
    return _mongo_client


def get_mongo_db() -> Optional[AsyncIOMotorDatabase]:
    client = get_mongo_client()
    if client is not None:
        return client[settings.MONGO_DB_NAME]
    return None


get_database = get_mongo_db


async def init_mongo_indexes():
    """
    Initializes unique indexes for user email and farmer handle in MongoDB.
    """
    global _mongo_available
    try:
        db = get_mongo_db()
        if db is not None:
            # Test ping
            await db.command("ping")
            users_col = db["users"]
            await users_col.create_index("email", unique=True)
            await users_col.create_index("handle", unique=True)
            _mongo_available = True
            logger.info("MongoDB Atlas connected and unique indexes verified.")
            return
    except Exception as e:
        _mongo_available = False
        logger.warning(f"MongoDB Atlas connection unverified ({e}). Using resilient high-speed in-memory store.")


def is_mongo_live() -> bool:
    return bool(_mongo_available)
