from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.schemas.question import QuestionOptionCreate, QuestionOptionResponse


class QuizStatus(str):
    DRAFT = "draft"
    WAITING = "waiting"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class QuestionCreate(BaseModel):
    text: str
    order: int
    type: str  # "text_input" or "multiple_choice"
    is_last: bool = False
    options: List[QuestionOptionCreate] = []


class QuestionResponse(BaseModel):
    id: UUID
    order: int
    text: str
    type: str
    is_last: bool
    options: List[QuestionOptionResponse] = []

    class Config:
        from_attributes = True


class QuizCreate(BaseModel):
    title: str
    questions: List[QuestionCreate]


class QuizResponse(BaseModel):
    id: UUID
    title: str
    invite_code: str
    status: str
    current_question_order: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    questions: List[QuestionResponse] = []

    class Config:
        from_attributes = True

