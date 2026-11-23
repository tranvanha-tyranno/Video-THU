from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    cors_origins: tuple[str, ...] = tuple(
        value.strip()
        for value in os.getenv("API_CORS_ORIGINS", "http://localhost:3000").split(",")
        if value.strip()
    )


settings = Settings()
