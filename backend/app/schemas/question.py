from pydantic import BaseModel
from typing import List
from uuid import UUID


class QuestionOptionCreate(BaseModel):
    text: str
    order: int


class QuestionOptionResponse(BaseModel):
    id: UUID
    text: str
    order: int

    class Config:
        from_attributes = True


# Note: QuestionCreate and QuestionResponse are defined in quiz.py to avoid circular imports
# Import them from there if needed

