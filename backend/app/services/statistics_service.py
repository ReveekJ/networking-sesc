from sqlalchemy.orm import Session
from uuid import UUID
from app.models import Answer, Question, QuestionOption
from app.schemas.statistics import StatisticsResponse, OptionStatistics


def get_statistics_for_question(db: Session, question_id: UUID) -> StatisticsResponse:
    """Get statistics for a question (only for multiple choice questions)."""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise ValueError("Question not found")
    
    if question.type != "multiple_choice":
        raise ValueError("Statistics only available for multiple choice questions")
    
    # Get all answers for this question
    answers = db.query(Answer).filter(Answer.question_id == question_id).all()
    total_answers = len(answers)
    
    # Get all options for this question
    options = db.query(QuestionOption).filter(
        QuestionOption.question_id == question_id
    ).order_by(QuestionOption.order).all()
    
    # Count selections for each option
    option_stats = []
    for option in options:
        count = 0
        for answer in answers:
            if answer.selected_options and str(option.id) in [str(opt_id) for opt_id in answer.selected_options]:
                count += 1
        
        percentage = (count / total_answers * 100) if total_answers > 0 else 0.0
        
        option_stats.append(OptionStatistics(
            option_id=option.id,
            option_text=option.text,
            count=count,
            percentage=round(percentage, 2)
        ))
    
    return StatisticsResponse(
        question_id=question.id,
        question_text=question.text,
        total_answers=total_answers,
        options=option_stats
    )


def get_statistics_for_last_question(db: Session, quiz_id: UUID) -> StatisticsResponse | None:
    """Get statistics for the last question of a quiz."""
    # Find the last question
    last_question = db.query(Question).filter(
        Question.quiz_id == quiz_id,
        Question.is_last == True
    ).first()
    
    if not last_question:
        return None
    
    return get_statistics_for_question(db, last_question.id)

