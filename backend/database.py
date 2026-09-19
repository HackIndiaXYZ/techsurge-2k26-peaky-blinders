"""SQLAlchemy engine/session factory and schema initialisation."""

from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from config import settings


class Base(DeclarativeBase):
    pass


connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)

if settings.database_url.startswith("sqlite"):

    @event.listens_for(engine, "connect")
    def _enable_sqlite_pragmas(dbapi_connection, _record):  # pragma: no cover - trivial
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()


SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def init_db() -> None:
    """Create tables that do not exist yet. Import models so they register on Base."""
    import models  # noqa: F401  (registers ORM classes)

    Base.metadata.create_all(bind=engine)

    # Defensive sqlite column migrations
    with engine.begin() as conn:
        try:
            cols = [row[1] for row in conn.exec_driver_sql("PRAGMA table_info(payment_verifications)").fetchall()]
            if cols and "timeline" not in cols:
                conn.exec_driver_sql("ALTER TABLE payment_verifications ADD COLUMN timeline JSON DEFAULT '[]'")
        except Exception:
            pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
