from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False)
    name = Column(String, nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    question_status = Column(JSON, default={})  # {"question": "answered"|"pending", "voting": "answered"|"pending"}

    survey = relationship("Survey", back_populates="teams")
    participants = relationship("Participant", back_populates="team", cascade="all, delete-orphan")
    answers = relationship("Answer", back_populates="team", cascade="all, delete-orphan")
    votes = relationship("Vote", back_populates="team", cascade="all, delete-orphan")

