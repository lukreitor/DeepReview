"""Application configuration via Pydantic Settings."""
from functools import lru_cache
from typing import Literal

from pydantic import AnyHttpUrl, EmailStr, Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    environment: Literal["development", "staging", "production"] = Field(
        "development", alias="ENVIRONMENT"
    )
    log_level: str = Field("INFO", alias="LOG_LEVEL")

    frontend_url: AnyHttpUrl = Field("http://localhost:3000", alias="FRONTEND_URL")
    backend_url: AnyHttpUrl = Field("http://localhost:8000", alias="BACKEND_URL")

    mongodb_uri: str = Field(..., alias="MONGODB_URI")
    mongodb_db: str = Field("deepreview", alias="MONGODB_DB")
    redis_url: str = Field("redis://redis:6379/0", alias="REDIS_URL")

    deepseek_api_key: str = Field(..., alias="DEEPSEEK_API_KEY")
    deepseek_base_url: AnyHttpUrl = Field("https://api.deepseek.com/v1", alias="DEEPSEEK_BASE_URL")
    deepseek_model: str = Field("deepseek-chat", alias="DEEPSEEK_MODEL")
    whisper_api_key: str = Field(..., alias="WHISPER_API_KEY")
    whisper_base_url: AnyHttpUrl = Field("https://api.lemonfox.ai", alias="WHISPER_BASE_URL")

    openai_api_key: str | None = Field(None, alias="OPENAI_API_KEY")

    jwt_secret: str = Field("change-me", alias="JWT_SECRET")
    jwt_algorithm: str = Field("HS256", alias="JWT_ALGORITHM")
    jwt_access_token_expires_minutes: int = Field(
        60, alias="JWT_ACCESS_TOKEN_EXPIRES_MINUTES"
    )

    rate_limit: str = Field("10/hour", alias="RATE_LIMIT")
    review_cache_ttl_seconds: int = Field(86400, alias="REVIEW_CACHE_TTL_SECONDS")
    review_cache_prefix: str = Field("deepreview:review-cache", alias="REVIEW_CACHE_PREFIX")
    websocket_channel_prefix: str = Field("deepreview:ws", alias="WEBSOCKET_CHANNEL_PREFIX")

    sentry_dsn: str | None = Field(None, alias="SENTRY_DSN")
    growthbook_api_host: AnyHttpUrl = Field(
        "https://api.growthbook.io", alias="GROWTHBOOK_API_HOST"
    )
    growthbook_client_key: str | None = Field(None, alias="GROWTHBOOK_CLIENT_KEY")
    posthog_api_key: str | None = Field(None, alias="POSTHOG_API_KEY")

    demo_user_email: EmailStr = Field("demo@deepreview.dev", alias="DEMO_USER_EMAIL")
    demo_user_password: str = Field("DeepReview!123", alias="DEMO_USER_PASSWORD")
    demo_user_full_name: str = Field("DeepReview Demo", alias="DEMO_USER_FULL_NAME")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
