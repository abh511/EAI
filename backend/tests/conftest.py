import os

# Tests never touch the real database, whatever backend/.env says
os.environ["DATA_SOURCE"] = "csv"

import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest_asyncio.fixture
async def client():
    """Async test client for FastAPI app"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
