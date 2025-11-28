from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.database import get_db
from app.schemas.answer import AnswerCreate, AnswerResponse
from app.services import answer_service, quiz_service, team_service
from app.models import Participant
from app.models.quiz import QuizStatus
from app.websocket import handlers

router = APIRouter(prefix="/api/quizzes/{invite_code}/answers", tags=["answers"])


@router.post("", response_model=AnswerResponse, status_code=201)
async def submit_answer(
    invite_code: str,
    participant_id: UUID,
    answer_data: AnswerCreate,
    db: Session = Depends(get_db)
):
    """Submit an answer."""
    quiz = quiz_service.get_quiz_by_invite_code(db, invite_code)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    if quiz.status != QuizStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Quiz is not in progress")
    
    # Verify participant belongs to a team in this quiz
    participant = db.query(Participant).filter(
        Participant.id == participant_id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    team = team_service.get_team_by_id(db, participant.team_id)
    if not team or team.quiz_id != quiz.id:
        raise HTTPException(status_code=403, detail="Participant does not belong to this quiz")
    
    try:
        answer = answer_service.create_answer(db, participant_id, answer_data)
        # Broadcast answer submitted event
        await handlers.broadcast_answer_submitted(invite_code, str(participant_id))
        return answer
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

