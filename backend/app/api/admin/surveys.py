from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.survey import SurveyCreate, SurveyResponse, SurveyStatusResponse, SurveyResultsResponse
from app.services.survey_service import SurveyService
from app.config import settings

router = APIRouter()


@router.post("/surveys", response_model=SurveyResponse)
def create_survey(
    survey_data: SurveyCreate,
    db: Session = Depends(get_db)
):
    """
    Create new survey
    """
    try:
        survey = SurveyService.create_survey(db, survey_data.title, settings.frontend_url)
        # Convert to dict first to ensure proper serialization
        survey_dict = {
            "id": survey.id,
            "title": survey.title,
            "invite_code": survey.invite_code,
            "qr_code_data": survey.qr_code_data,
            "status": survey.status.value if hasattr(survey.status, 'value') else str(survey.status),
            "current_stage": survey.current_stage.value if hasattr(survey.current_stage, 'value') else str(survey.current_stage),
            "created_at": survey.created_at,
            "updated_at": survey.updated_at
        }
        return SurveyResponse(**survey_dict)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/surveys/{survey_id}", response_model=SurveyResponse)
def get_survey(
    survey_id: int,
    db: Session = Depends(get_db)
):
    """
    Get survey by ID
    """
    survey = SurveyService.get_survey_by_id(db, survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    return SurveyResponse.model_validate(survey, from_attributes=True)


@router.post("/surveys/{survey_id}/start", response_model=SurveyResponse)
def start_survey(
    survey_id: int,
    db: Session = Depends(get_db)
):
    """
    Start survey
    """
    try:
        survey = SurveyService.start_survey(db, survey_id)
        return SurveyResponse.model_validate(survey, from_attributes=True)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/surveys/{survey_id}/next-stage", response_model=SurveyResponse)
def next_stage(
    survey_id: int,
    db: Session = Depends(get_db)
):
    """
    Move survey to next stage
    """
    try:
        survey = SurveyService.next_stage(db, survey_id)
        return SurveyResponse.model_validate(survey, from_attributes=True)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/surveys/{survey_id}/status", response_model=SurveyStatusResponse)
def get_survey_status(
    survey_id: int,
    db: Session = Depends(get_db)
):
    """
    Get survey status with teams
    """
    try:
        status = SurveyService.get_survey_status(db, survey_id)
        return status
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/surveys/{survey_id}/results", response_model=SurveyResultsResponse)
def get_survey_results(
    survey_id: int,
    db: Session = Depends(get_db)
):
    """
    Get survey results with statistics
    """
    try:
        results = SurveyService.get_survey_results(db, survey_id)
        return results
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

