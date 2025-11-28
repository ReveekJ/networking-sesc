from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.quiz import QuizCreate, QuizResponse
from app.services import quiz_service

router = APIRouter(prefix="/api/quizzes", tags=["quizzes"])


@router.post("", response_model=QuizResponse, status_code=201)
def create_quiz(quiz_data: QuizCreate, db: Session = Depends(get_db)):
    """Create a new quiz."""
    quiz = quiz_service.create_quiz(db, quiz_data)
    return quiz


@router.get("/{invite_code}", response_model=QuizResponse)
def get_quiz(invite_code: str, db: Session = Depends(get_db)):
    """Get quiz by invite code."""
    quiz = quiz_service.get_quiz_by_invite_code(db, invite_code)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz

