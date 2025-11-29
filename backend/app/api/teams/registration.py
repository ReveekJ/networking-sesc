from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.team import TeamRegister, TeamResponse, TeamStatusResponse
from app.services.team_service import TeamService
from app.services.survey_service import SurveyService

router = APIRouter()


@router.post("/register", response_model=TeamResponse)
def register_team(
    team_data: TeamRegister,
    db: Session = Depends(get_db)
):
    """
    Register new team
    """
    # Get survey by invite code
    survey = SurveyService.get_survey_by_invite_code(db, team_data.survey_invite_code)
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    try:
        team = TeamService.register_team(
            db,
            survey.id,
            team_data.team_name,
            [p.dict() for p in team_data.participants]
        )
        return team
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/survey/{invite_code}")
def get_survey_info(
    invite_code: str,
    db: Session = Depends(get_db)
):
    """
    Get survey information by invite code
    """
    survey = SurveyService.get_survey_by_invite_code(db, invite_code)
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    return {
        "id": survey.id,
        "title": survey.title,
        "status": survey.status.value,
        "current_stage": survey.current_stage.value
    }

