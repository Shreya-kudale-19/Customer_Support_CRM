from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Database path (local SQLite file)
SQLALCHEMY_DATABASE_URL = "sqlite:///./sqlite.db"

# Create the SQLAlchemy database engine
# connect_args={"check_same_thread": False} is required only for SQLite because
# it prevents multiple threads from accessing the same connection at once.
# FastAPI uses multithreading for synchronous endpoint calls, so this is critical.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# SessionLocal is the session factory. Each time we instantiate it, we get a new database session.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class which all database models will inherit from to be mapped to DB tables
Base = declarative_base()

# Dependency utility function to yield DB sessions per request, ensuring clean cleanup
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
