from functools import lru_cache
from supabase import create_client, Client
from app.core.config import settings
from loguru import logger

@lru_cache()
def get_supabase_client() -> Client:
    """
    Create and cache Supabase client instance.
    Uses service role key for admin operations.
    """
    try:
        client = create_client(
            supabase_url=settings.SUPABASE_URL,
            supabase_key=settings.SUPABASE_SERVICE_ROLE_KEY
        )
        logger.info("Supabase client initialized")
        return client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {str(e)}")
        raise

__all__ = ["get_supabase_client"]
