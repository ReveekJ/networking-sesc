from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.statistics import StatisticsResponse
from app.services import quiz_service, statistics_service

router = APIRouter(prefix="/api/quizzes/{invite_code}/statistics", tags=["statistics"])


@router.get("", response_model=StatisticsResponse)
def get_statistics(invite_code: str, db: Session = Depends(get_db)):
    """Get statistics for the last question."""
    quiz = quiz_service.get_quiz_by_invite_code(db, invite_code)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    try:
        stats = statistics_service.get_statistics_for_last_question(db, quiz.id)
        if not stats:
            raise HTTPException(status_code=404, detail="No statistics available")
        return stats
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

