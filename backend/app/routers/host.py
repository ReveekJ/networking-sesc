import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.quiz import QuestionResponse
from app.services import quiz_service
from app.services.last_question_service import get_or_create_last_question, create_last_question_in_db
from app.models import Question, Quiz
from app.models.quiz import QuizStatus
from app.websocket import handlers

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/quizzes/{invite_code}", tags=["host"])


@router.post("/start", status_code=200)
async def start_quiz(invite_code: str, db: Session = Depends(get_db)):
    """Start the quiz (host only)."""
    quiz = quiz_service.get_quiz_by_invite_code(db, invite_code)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    if quiz.status != QuizStatus.WAITING:
        raise HTTPException(status_code=400, detail="Quiz cannot be started in current status")
    
    # Set first question as current
    first_question = db.query(Question).filter(
        Question.quiz_id == quiz.id
    ).order_by(Question.order).first()
    
    if not first_question:
        raise HTTPException(status_code=400, detail="No questions found")
    
    # Update both status and current_question_order in a single transaction
    quiz.current_question_order = first_question.order
    quiz.status = QuizStatus.IN_PROGRESS
    logger.info(f"Starting quiz {invite_code}: setting current_question_order to {first_question.order}")
    db.flush()
    db.commit()
    db.refresh(quiz)
    logger.info(f"Quiz {invite_code} started: status={quiz.status}, current_question_order={quiz.current_question_order}")
    
    # Broadcast quiz started event (don't fail if broadcast fails)
    try:
        await handlers.broadcast_quiz_started(invite_code)
    except Exception as e:
        logger.error(f"Error broadcasting quiz started: {e}")
    
    return {"message": "Quiz started", "current_question_order": first_question.order}


@router.get("/current-question", response_model=QuestionResponse)
def get_current_question(invite_code: str, db: Session = Depends(get_db)):
    """Get current question."""
    quiz = quiz_service.get_quiz_by_invite_code(db, invite_code)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    logger.debug(f"Getting current question for quiz {invite_code}: status={quiz.status}, current_question_order={quiz.current_question_order}")
    
    if quiz.status != QuizStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Quiz is not in progress")
    
    if quiz.current_question_order is None:
        logger.warning(f"No current question set for quiz {invite_code}")
        raise HTTPException(status_code=404, detail="No current question")
    
    # Get max order of existing questions
    max_order = db.query(Question.order).filter(
        Question.quiz_id == quiz.id
    ).order_by(Question.order.desc()).first()
    
    max_order_value = max_order[0] if max_order else 0
    logger.debug(f"Max order for quiz {invite_code}: {max_order_value}, current_question_order: {quiz.current_question_order}")
    
    # If current question order is greater than max, it's the last (dynamic) question
    if quiz.current_question_order > max_order_value:
        # Generate last question dynamically
        return get_or_create_last_question(db, quiz.id)
    
    # Regular question from DB
    question = db.query(Question).filter(
        Question.quiz_id == quiz.id,
        Question.order == quiz.current_question_order
    ).first()
    
    if not question:
        logger.error(f"Question not found for quiz {invite_code} with order {quiz.current_question_order}")
        raise HTTPException(status_code=404, detail="Question not found")
    
    return question


@router.post("/next-question", status_code=200)
async def next_question(invite_code: str, db: Session = Depends(get_db)):
    """Move to next question (host only)."""
    quiz = quiz_service.get_quiz_by_invite_code(db, invite_code)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    if quiz.status != QuizStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Quiz is not in progress")
    
    if quiz.current_question_order is None:
        raise HTTPException(status_code=400, detail="No current question")
    
    # Get next question
    current_question = db.query(Question).filter(
        Question.quiz_id == quiz.id,
        Question.order == quiz.current_question_order
    ).first()
    
    if not current_question:
        raise HTTPException(status_code=404, detail="Current question not found")
    
    # Get max order of existing questions
    max_order = db.query(Question.order).filter(
        Question.quiz_id == quiz.id
    ).order_by(Question.order.desc()).first()
    
    max_order_value = max_order[0] if max_order else 0
    
    # Check if current question is the last text question
    if current_question.order >= max_order_value:
        # This is the last text question, move to dynamic last question
        # Create the last question in DB
        try:
            last_question = create_last_question_in_db(db, quiz.id)
            quiz_service.set_current_question(db, quiz.id, last_question.order)
            
            # Broadcast question changed event
            await handlers.broadcast_question_changed(invite_code, last_question.order)
            
            return {"message": "Moved to last question", "current_question_order": last_question.order}
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    # Regular next question
    next_question = db.query(Question).filter(
        Question.quiz_id == quiz.id,
        Question.order > current_question.order
    ).order_by(Question.order).first()
    
    if not next_question:
        # Should not happen, but handle it
        raise HTTPException(status_code=400, detail="Next question not found")
    
    quiz_service.set_current_question(db, quiz.id, next_question.order)
    
    # Broadcast question changed event
    await handlers.broadcast_question_changed(invite_code, next_question.order)
    
    return {"message": "Moved to next question", "current_question_order": next_question.order}


@router.post("/finish", status_code=200)
async def finish_quiz(invite_code: str, db: Session = Depends(get_db)):
    """Finish the quiz (host only)."""
    quiz = quiz_service.get_quiz_by_invite_code(db, invite_code)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    if quiz.status != QuizStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Quiz must be in progress to finish")
    
    # Update quiz status to completed
    quiz.status = QuizStatus.COMPLETED
    db.commit()
    db.refresh(quiz)
    logger.info(f"Quiz {invite_code} finished: status={quiz.status}")
    
    # Broadcast quiz completed event
    try:
        await handlers.broadcast_quiz_completed(invite_code)
    except Exception as e:
        logger.error(f"Error broadcasting quiz completed: {e}")
    
    return {"message": "Quiz finished"}

