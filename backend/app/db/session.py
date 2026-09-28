import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger("uvicorn.error")

def get_engine():
    target_url = settings.DATABASE_URL
    is_sqlite = target_url.startswith("sqlite")
    
    if is_sqlite:
        return create_engine(
            target_url,
            connect_args={"check_same_thread": False}
        )
    
    # Attempt connecting to PostgreSQL
    try:
        engine = create_engine(
            target_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20
        )
        # Test connection
        with engine.connect() as conn:
            pass
        logger.info("Successfully connected to primary PostgreSQL database.")
        return engine
    except Exception as e:
        if settings.USE_SQLITE_DEV_FALLBACK:
            logger.warning(
                f"PostgreSQL connection failed ({e}). "
                f"Falling back to local SQLite ({settings.SQLITE_DB_PATH}) for development only. "
                "Ensure PostgreSQL is configured for production!"
            )
            fallback_url = f"sqlite:///{settings.SQLITE_DB_PATH}"
            return create_engine(
                fallback_url,
                connect_args={"check_same_thread": False}
            )
        else:
            logger.error(f"Failed to connect to PostgreSQL: {e}")
            raise e

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a SQLAlchemy database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
