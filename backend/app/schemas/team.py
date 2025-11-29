from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime


class ParticipantCreate(BaseModel):
    first_name: str
    last_name: str
    contact_info: Dict[str, str]
    profession: str


class TeamRegister(BaseModel):
    survey_invite_code: str
    team_name: str
    participants: List[ParticipantCreate]


class TeamResponse(BaseModel):
    id: int
    survey_id: int
    name: str
    joined_at: datetime

    class Config:
        from_attributes = True


class TeamStatusResponse(BaseModel):
    team_id: int
    team_name: str
    survey_id: int
    survey_title: Optional[str] = None
    survey_status: Optional[str] = None
    current_stage: Optional[str] = None
    question_status: str
    voting_status: str


class AnswerSubmit(BaseModel):
    answers: List[str]


class VoteSubmit(BaseModel):
    answer_ids: List[int]

