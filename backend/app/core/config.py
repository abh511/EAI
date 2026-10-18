from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    APP_NAME: str = "EnviroWatch AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    DATABASE_URL: str

    ALLOWED_ORIGINS: str = "http://localhost:3000"
    MODEL_DIR: str = "./app/ml/saved_models"
    DATASET_PATH: str = "./data/pune_mumbai_environmental_data_17022026.csv"
    # "supabase" reads env_readings from the database (falls back to the CSV if unreachable)
    DATA_SOURCE: str = "csv"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
