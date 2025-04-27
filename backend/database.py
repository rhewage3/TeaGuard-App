from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from urllib.parse import quote_plus

# Database Configuration

# Local
# DB_USER = "postgres"
# DB_PASSWORD = "root"
# DB_HOST = "localhost"
# DB_PORT = "5433"
# DB_NAME = "teaguard"
# DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Supabase
DB_PASSWORD = "@Rhewage3"
ENCODED_PASSWORD = quote_plus(DB_PASSWORD)

DATABASE_URL = f"postgresql+asyncpg://postgres.uypqhcslykxopdouxjgs:{ENCODED_PASSWORD}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

#  SSL options to skip verification
connect_args = {
    "ssl": False
}

engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    connect_args=connect_args,
)

# Create async session
async_session = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    async with async_session() as session:
        yield session
