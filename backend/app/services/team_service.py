from sqlalchemy.orm import Session
from app.models import Team, Participant, Quiz
from app.schemas.team import TeamCreate, ParticipantCreate
from app.models.quiz import QuizStatus


def create_team(db: Session, quiz_id, team_data: TeamCreate) -> Team:
    """Create a new team with participants."""
    # Check if quiz exists and is in waiting status
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise ValueError("Quiz not found")
    
    # Update quiz status to waiting if it's draft
    if quiz.status == QuizStatus.DRAFT:
        quiz.status = QuizStatus.WAITING
    
    team = Team(
        quiz_id=quiz_id,
        name=team_data.name
    )
    db.add(team)
    db.flush()
    
    # Create participants
    for participant_data in team_data.participants:
        participant = Participant(
            team_id=team.id,
            first_name=participant_data.first_name,
            last_name=participant_data.last_name,
            contact_info=participant_data.contact_info,
            profession=participant_data.profession
        )
        db.add(participant)
    
    db.commit()
    db.refresh(team)
    return team


def get_teams_by_quiz(db: Session, quiz_id) -> list[Team]:
    """Get all teams for a quiz."""
    return db.query(Team).filter(Team.quiz_id == quiz_id).all()


def get_team_by_id(db: Session, team_id) -> Team | None:
    """Get team by ID."""
    return db.query(Team).filter(Team.id == team_id).first()

