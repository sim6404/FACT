from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "F.A.C.T API"
    app_env: str = "local"
    api_prefix: str = "/api"
    auto_create_tables: bool = False
    enable_db_persistence: bool = False
    postgres_dsn: str = "postgresql+psycopg2://fact:fact@localhost:5432/fact"
    redis_url: str = "redis://localhost:6379/0"
    snowflake_mode: str = "mock"
    snowflake_account: str = "placeholder"
    snowflake_user: str = "placeholder"
    snowflake_password: str = "placeholder"
    snowflake_warehouse: str = "compute_wh"
    snowflake_database: str = "FACT"
    snowflake_schema: str = "CORE"
    snowflake_role: str = "FACT_APP_ROLE"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
