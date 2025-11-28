from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.database import Base


class Team(Base):
    __tablename__ = "teams"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("quizzes.id"), nullable=False)
    name = Column(String, nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    quiz = relationship("Quiz", back_populates="teams")
    participants = relationship("Participant", back_populates="team", cascade="all, delete-orphan")


class Participant(Base):
    __tablename__ = "participants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    contact_info = Column(JSON, nullable=True)  # {"phone": "...", "email": "..."}
    profession = Column(String, nullable=True)

    team = relationship("Team", back_populates="participants")
    answers = relationship("Answer", back_populates="participant", cascade="all, delete-orphan")

