import secrets
from sqlalchemy.orm import Session
from app.models import Quiz, Question, QuestionOption
from app.schemas.quiz import QuizCreate, QuizResponse, QuestionCreate
from app.models.quiz import QuizStatus


def generate_invite_code() -> str:
    """Generate a unique 6-character invite code."""
    return secrets.token_urlsafe(6)[:6].upper()


def create_quiz(db: Session, quiz_data: QuizCreate) -> Quiz:
    """Create a new quiz with questions. All questions must be text_input."""
    invite_code = generate_invite_code()
    
    # Ensure invite code is unique
    while db.query(Quiz).filter(Quiz.invite_code == invite_code).first():
        invite_code = generate_invite_code()
    
    quiz = Quiz(
        title=quiz_data.title,
        invite_code=invite_code,
        status=QuizStatus.DRAFT
    )
    db.add(quiz)
    db.flush()
    
    # Create questions - all must be text_input
    for question_data in quiz_data.questions:
        # Force all questions to be text_input
        question = Question(
            quiz_id=quiz.id,
            order=question_data.order,
            text=question_data.text,
            type="text_input",  # All questions are text_input
            is_last=False  # Last question will be generated dynamically
        )
        db.add(question)
    
    db.commit()
    db.refresh(quiz)
    return quiz


def get_quiz_by_invite_code(db: Session, invite_code: str) -> Quiz | None:
    """Get quiz by invite code."""
    return db.query(Quiz).filter(Quiz.invite_code == invite_code).first()


def update_quiz_status(db: Session, quiz_id, status: QuizStatus) -> Quiz | None:
    """Update quiz status."""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if quiz:
        quiz.status = status
        db.commit()
        db.refresh(quiz)
    return quiz


def set_current_question(db: Session, quiz_id, question_order: int) -> Quiz | None:
    """Set current question for quiz."""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if quiz:
        quiz.current_question_order = question_order
        db.commit()
        db.refresh(quiz)
    return quiz

