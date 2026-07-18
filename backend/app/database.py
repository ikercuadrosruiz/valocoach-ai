import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import redis
from .logger import get_logger

logger = get_logger(__name__)

# Configuración de PostgreSQL
# Si se levanta localmente con Docker, la URL es localhost:5433
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://valocoach:supersecretpassword@localhost:5433/valocoach_db")

logger.info(f"Conectando a base de datos en: {SQLALCHEMY_DATABASE_URL.split('@')[-1]}")
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Configuración de Redis
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
logger.info(f"Conectando a Redis en: {REDIS_URL}")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# Dependencia para FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
