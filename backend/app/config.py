from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./database/data/portfolio.db"
    
    # API
    api_v1_prefix: str = "/api/v1"
    
    # CORS
    cors_origins: list = ["http://localhost:4200"]
    
    # Environment
    environment: str = "development"
    debug: bool = True
    
    class Config:
        env_file = ".env"

settings = Settings()