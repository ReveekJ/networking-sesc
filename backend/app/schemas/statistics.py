from pydantic import BaseModel
from typing import List
from uuid import UUID


class OptionStatistics(BaseModel):
    option_id: UUID
    option_text: str
    count: int
    percentage: float


class StatisticsResponse(BaseModel):
    question_id: UUID
    question_text: str
    total_answers: int
    options: List[OptionStatistics]

