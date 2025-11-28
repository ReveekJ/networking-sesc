from pydantic import BaseModel
from typing import Optional, Dict, List
from uuid import UUID
from datetime import datetime


class ParticipantCreate(BaseModel):
    first_name: str
    last_name: str
    contact_info: Optional[Dict[str, str]] = None
    profession: Optional[str] = None


class ParticipantResponse(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    contact_info: Optional[Dict[str, str]] = None
    profession: Optional[str] = None

    class Config:
        from_attributes = True


class TeamCreate(BaseModel):
    name: str
    participants: List[ParticipantCreate]


class TeamResponse(BaseModel):
    id: UUID
    name: str
    joined_at: datetime
    participants: List[ParticipantResponse] = []

    class Config:
        from_attributes = True

