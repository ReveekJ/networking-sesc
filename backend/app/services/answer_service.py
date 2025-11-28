from sqlalchemy.orm import Session
from uuid import UUID
from app.models import Answer, Participant, Question, Quiz
from app.schemas.answer import AnswerCreate


def create_answer(db: Session, participant_id: UUID, answer_data: AnswerCreate) -> Answer:
    """Create an answer for a participant."""
    # Check if participant exists
    participant = db.query(Participant).filter(Participant.id == participant_id).first()
    if not participant:
        raise ValueError("Participant not found")
    
    # Check if question exists
    question = db.query(Question).filter(Question.id == answer_data.question_id).first()
    if not question:
        raise ValueError("Question not found")
    
    # Convert UUID objects to strings for JSON serialization
    selected_options_json = None
    if answer_data.selected_options:
        selected_options_json = [str(option_id) for option_id in answer_data.selected_options]
    
    # Check if answer already exists
    existing_answer = db.query(Answer).filter(
        Answer.participant_id == participant_id,
        Answer.question_id == answer_data.question_id
    ).first()
    
    if existing_answer:
        # Update existing answer
        existing_answer.text_answer = answer_data.text_answer
        existing_answer.selected_options = selected_options_json
        db.commit()
        db.refresh(existing_answer)
        return existing_answer
    
    # Create new answer
    answer = Answer(
        participant_id=participant_id,
        question_id=answer_data.question_id,
        text_answer=answer_data.text_answer,
        selected_options=selected_options_json
    )
    db.add(answer)
    db.commit()
    db.refresh(answer)
    return answer


def get_answers_by_question(db: Session, question_id: UUID) -> list[Answer]:
    """Get all answers for a question."""
    return db.query(Answer).filter(Answer.question_id == question_id).all()


def get_participant_answers(db: Session, participant_id: UUID) -> list[Answer]:
    """Get all answers for a participant."""
    return db.query(Answer).filter(Answer.participant_id == participant_id).all()

