from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class SurveyStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"


class SurveyStage(str, enum.Enum):
    QUESTION = "question"
    VOTING = "voting"
    RESULTS = "results"


class Survey(Base):
    __tablename__ = "surveys"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    invite_code = Column(String, unique=True, index=True, nullable=False)
    qr_code_data = Column(String, nullable=True)
    status = Column(Enum(SurveyStatus), default=SurveyStatus.DRAFT, nullable=False)
    current_stage = Column(Enum(SurveyStage), default=SurveyStage.QUESTION, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    teams = relationship("Team", back_populates="survey", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="survey", cascade="all, delete-orphan")

