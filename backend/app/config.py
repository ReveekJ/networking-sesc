from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    app_name: str = "Survey System"
    debug: bool = True
    frontend_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

