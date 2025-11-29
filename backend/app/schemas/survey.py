from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class SurveyCreate(BaseModel):
    title: str


class SurveyResponse(BaseModel):
    id: int
    title: str
    invite_code: str
    qr_code_data: Optional[str] = None
    status: str
    current_stage: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SurveyStatusResponse(BaseModel):
    survey_id: int
    title: str
    status: str
    current_stage: str
    teams: List[dict]
    teams_count: int


class SurveyResultsResponse(BaseModel):
    answers: List[dict]
    statistics: List[dict]
    teams_voting: List[dict]
    total_votes: int

