from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

engine_kwargs: dict = {"pool_pre_ping": True}

if settings.postgres_dsn.startswith("postgresql"):
    engine_kwargs["connect_args"] = {"connect_timeout": 2}

engine = create_engine(settings.postgres_dsn, **engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, class_=Session)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
