from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Database Configuration
DB_USER = "postgres"
DB_PASSWORD = "root"  # Replace with your actual password
# DB_HOST = "localhost"
DB_HOST = "localhost"
DB_PORT = "5433"
DB_NAME = "teaguard"

DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"


# Supabase PostgreSQL connection string
# DATABASE_URL = "postgresql+asyncpg://postgres:[YOUR-PASSWORD]@db.rpykwjtfnojgoqjubzqx.supabase.co:5432/postgres"

# Create async engine
engine = create_async_engine(DATABASE_URL, echo=True)

# Create async session factory
async_session = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

# Base class for models 
Base = declarative_base()

#  Dependency to get database session
async def get_db():
    async with async_session() as session:
        yield session
