from sqlalchemy import Column, String, Integer, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum

from app.database import Base


class QuizStatus(str, enum.Enum):
    DRAFT = "draft"
    WAITING = "waiting"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    invite_code = Column(String, unique=True, nullable=False, index=True)
    status = Column(SQLEnum(QuizStatus), default=QuizStatus.DRAFT, nullable=False)
    current_question_order = Column(Integer, nullable=True)  # Порядок текущего вопроса
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan", order_by="Question.order")
    teams = relationship("Team", back_populates="quiz", cascade="all, delete-orphan")

