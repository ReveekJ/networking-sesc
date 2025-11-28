from sqlalchemy.orm import Session
from uuid import UUID
import uuid
from collections import Counter
from app.models import Quiz, Question, QuestionOption, Answer
from app.schemas.quiz import QuestionResponse
from app.schemas.question import QuestionOptionResponse


def generate_last_question_from_answers(db: Session, quiz_id: UUID) -> QuestionResponse:
    """Generate the last question (multiple choice) from participants' text answers."""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise ValueError("Quiz not found")
    
    # Get all text questions (all questions except the last one)
    text_questions = db.query(Question).filter(
        Question.quiz_id == quiz_id
    ).order_by(Question.order).all()
    
    if not text_questions:
        raise ValueError("No questions found")
    
    # Collect all unique text answers from all text questions
    all_answers = []
    for question in text_questions:
        answers = db.query(Answer).filter(
            Answer.question_id == question.id,
            Answer.text_answer.isnot(None)
        ).all()
        for answer in answers:
            if answer.text_answer and answer.text_answer.strip():
                all_answers.append(answer.text_answer.strip())
    
    if not all_answers:
        raise ValueError("No answers found to generate options")
    
    # Count occurrences and get unique answers
    answer_counter = Counter(all_answers)
    # Get unique answers, sorted by frequency (most common first)
    unique_answers = [answer for answer, _ in answer_counter.most_common()]
    
    # Limit to reasonable number of options (e.g., top 10-15 unique answers)
    max_options = 15
    unique_answers = unique_answers[:max_options]
    
    # Create a virtual question response with options
    # We don't save it to DB, just return as response
    question_id = uuid.uuid4()  # Generate UUID for dynamic question
    
    options = [
        QuestionOptionResponse(
            id=uuid.uuid4(),  # Generate unique UUIDs
            text=answer,
            order=i
        )
        for i, answer in enumerate(unique_answers)
    ]
    
    return QuestionResponse(
        id=question_id,
        order=len(text_questions) + 1,  # Order after all text questions
        text="Выберите наиболее интересные/важные варианты из предложенных ответов участников:",
        type="multiple_choice",
        is_last=True,
        options=options
    )


def get_or_create_last_question(db: Session, quiz_id: UUID) -> QuestionResponse:
    """Get the last question, creating it dynamically if needed."""
    # Check if last question already exists in DB
    last_question = db.query(Question).filter(
        Question.quiz_id == quiz_id,
        Question.is_last == True
    ).first()
    
    if last_question:
        # Return existing question
        options = [
            QuestionOptionResponse(
                id=opt.id,
                text=opt.text,
                order=opt.order
            )
            for opt in last_question.options
        ]
        return QuestionResponse(
            id=last_question.id,
            order=last_question.order,
            text=last_question.text,
            type=last_question.type,
            is_last=last_question.is_last,
            options=options
        )
    
    # Generate dynamically
    return generate_last_question_from_answers(db, quiz_id)


def create_last_question_in_db(db: Session, quiz_id: UUID) -> Question:
    """Create and save the last question in database."""
    # Generate question data
    question_response = generate_last_question_from_answers(db, quiz_id)
    
    # Get max order
    max_order = db.query(Question.order).filter(
        Question.quiz_id == quiz_id
    ).order_by(Question.order.desc()).first()
    
    order = (max_order[0] if max_order else 0) + 1
    
    # Create question
    question = Question(
        quiz_id=quiz_id,
        order=order,
        text=question_response.text,
        type="multiple_choice",
        is_last=True
    )
    db.add(question)
    db.flush()
    
    # Create options
    for i, option_response in enumerate(question_response.options):
        option = QuestionOption(
            question_id=question.id,
            text=option_response.text,
            order=i
        )
        db.add(option)
    
    db.commit()
    db.refresh(question)
    return question

