from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.team import TeamCreate, TeamResponse
from app.services import quiz_service, team_service
from app.websocket import handlers

router = APIRouter(prefix="/api/quizzes/{invite_code}/teams", tags=["teams"])


@router.post("", response_model=TeamResponse, status_code=201)
async def create_team(invite_code: str, team_data: TeamCreate, db: Session = Depends(get_db)):
    """Register a new team for a quiz."""
    quiz = quiz_service.get_quiz_by_invite_code(db, invite_code)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    try:
        team = team_service.create_team(db, quiz.id, team_data)
        # Broadcast team joined event
        await handlers.broadcast_team_joined(invite_code, team.name)
        return team
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[TeamResponse])
def get_teams(invite_code: str, db: Session = Depends(get_db)):
    """Get all teams for a quiz (for host)."""
    quiz = quiz_service.get_quiz_by_invite_code(db, invite_code)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    teams = team_service.get_teams_by_quiz(db, quiz.id)
    return teams

