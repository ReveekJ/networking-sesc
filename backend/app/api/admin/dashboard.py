from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.survey_service import SurveyService

router = APIRouter()


@router.get("/surveys/{survey_id}/teams")
def get_teams(
    survey_id: int,
    db: Session = Depends(get_db)
):
    """
    Get teams list for polling
    """
    try:
        status = SurveyService.get_survey_status(db, survey_id)
        return status
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

