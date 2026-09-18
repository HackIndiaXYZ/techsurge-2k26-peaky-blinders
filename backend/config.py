"""Runtime configuration, read from environment variables / .env."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", env_prefix="PAUSEPAY_", extra="ignore", protected_namespaces=('settings_',))

    database_url: str = f"sqlite:///{(BACKEND_DIR / 'data' / 'pausepay.db').as_posix()}"
    model_path: Path = BACKEND_DIR / "models_store" / "intent_model.joblib"
    fraud_list_path: Path = BACKEND_DIR / "data" / "known_fraud_identifiers.json"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    seed_demo_data: bool = True
    engine_version: str = "pausepay-risk-1.0.0"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
