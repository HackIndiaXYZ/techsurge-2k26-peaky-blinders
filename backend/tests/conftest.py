"""Shared fixtures: every test module gets an isolated SQLite database."""

import os
import sys
import warnings
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

# Must be set before `config` is imported anywhere.
_DB_PATH = BACKEND_DIR / "data" / "test_pausepay.db"
os.environ["PAUSEPAY_DATABASE_URL"] = f"sqlite:///{_DB_PATH.as_posix()}"
os.environ["PAUSEPAY_SEED_DEMO_DATA"] = "true"

warnings.filterwarnings("ignore", category=DeprecationWarning)

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from database import Base, SessionLocal, engine  # noqa: E402
from main import app  # noqa: E402


def _reset_schema() -> None:
    import models  # noqa: F401

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


@pytest.fixture()
def client():
    """Fresh database + running app (lifespan seeds the confirmed-fraud list)."""
    _reset_schema()
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def db():
    _reset_schema()
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def pytest_sessionfinish(session, exitstatus):  # noqa: ARG001
    engine.dispose()
    for suffix in ("", "-wal", "-shm"):
        try:
            Path(str(_DB_PATH) + suffix).unlink()
        except FileNotFoundError:
            pass
