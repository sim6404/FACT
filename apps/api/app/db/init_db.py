from app.db.base import Base
from app.db.models import (  # noqa: F401
    AgentRun,
    AgentRunSource,
    Alert,
    Approval,
    ConnectorRun,
    InquiryHistory,
    ProductionInquiry,
    ProductionItem,
    Report,
    ReportJob,
    Role,
    SavedQuery,
    User,
)
from app.db.session import engine


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
