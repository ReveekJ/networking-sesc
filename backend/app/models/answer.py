from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSON, ARRAY
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.database import Base


class Answer(Base):
    __tablename__ = "answers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    participant_id = Column(UUID(as_uuid=True), ForeignKey("participants.id"), nullable=False)
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id"), nullable=False)
    text_answer = Column(String, nullable=True)  # для текстовых вопросов
    selected_options = Column(JSON, nullable=True)  # массив UUID для мультивыбора
    answered_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    participant = relationship("Participant", back_populates="answers")
    question = relationship("Question", back_populates="answers")

