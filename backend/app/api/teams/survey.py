from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.team import AnswerSubmit, VoteSubmit, TeamStatusResponse
from app.services.team_service import TeamService

router = APIRouter()


@router.post("/teams/{team_id}/answers")
def submit_answers(
    team_id: int,
    answers_data: AnswerSubmit,
    db: Session = Depends(get_db)
):
    """
    Submit team answers
    """
    try:
        answers = TeamService.submit_answers(db, team_id, answers_data.answers)
        return {"message": "Answers submitted successfully", "count": len(answers)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/teams/{team_id}/votes")
def submit_votes(
    team_id: int,
    votes_data: VoteSubmit,
    db: Session = Depends(get_db)
):
    """
    Submit team votes
    """
    try:
        votes = TeamService.submit_votes(db, team_id, votes_data.answer_ids)
        return {"message": "Votes submitted successfully", "count": len(votes)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/teams/{team_id}/status", response_model=TeamStatusResponse)
def get_team_status(
    team_id: int,
    db: Session = Depends(get_db)
):
    """
    Get team status
    """
    try:
        status = TeamService.get_team_status(db, team_id)
        return status
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/teams/{team_id}/available-answers")
def get_available_answers(
    team_id: int,
    db: Session = Depends(get_db)
):
    """
    Get available answers for voting
    """
    team = TeamService.get_team_by_id(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    answers = TeamService.get_available_answers(db, team.survey_id)
    return {"answers": answers}


@router.get("/teams/{team_id}/results")
def get_team_results(
    team_id: int,
    db: Session = Depends(get_db)
):
    """
    Get survey results for team
    """
    team = TeamService.get_team_by_id(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    from app.services.survey_service import SurveyService
    try:
        results = SurveyService.get_survey_results(db, team.survey_id)
        return results
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

