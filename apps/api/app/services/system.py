from app.schemas.domain import SystemHealthRead


def get_system_health() -> SystemHealthRead:
    return SystemHealthRead(
        status="ok",
        services={
            "api": "up",
            "postgres": "planned",
            "redis": "planned",
            "snowflake": "planned",
        },
    )
