from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class AnswerCreate(BaseModel):
    question_id: UUID
    text_answer: Optional[str] = None
    selected_options: Optional[List[UUID]] = None


class AnswerResponse(BaseModel):
    id: UUID
    question_id: UUID
    text_answer: Optional[str] = None
    selected_options: Optional[List[UUID]] = None
    answered_at: datetime

    class Config:
        from_attributes = True

