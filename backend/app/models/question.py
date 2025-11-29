from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
import enum
from app.database import Base


class QuestionType(str, enum.Enum):
    QUESTION = "question"
    VOTING = "voting"
    RESULTS = "results"


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False)
    type = Column(Enum(QuestionType), nullable=False)
    content = Column(String, nullable=False)
    order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=False, nullable=False)

    survey = relationship("Survey", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")

