from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from app.database import SessionLocal
from app.utils.websocket_manager import websocket_manager
from app.services.survey_service import SurveyService
from app.services.team_service import TeamService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/admin/survey/{survey_id}")
async def websocket_admin_survey(websocket: WebSocket, survey_id: int):
    """
    WebSocket endpoint for admin to receive survey updates
    """
    await websocket_manager.connect_admin(websocket, survey_id)
    
    try:
        # Send initial status
        db = SessionLocal()
        try:
            status = SurveyService.get_survey_status(db, survey_id)
            await websocket.send_json({
                "type": "survey_status",
                "data": status
            })
        except Exception as e:
            logger.error(f"Error sending initial status: {e}")
        finally:
            db.close()
        
        # Keep connection alive and handle messages
        while True:
            try:
                data = await websocket.receive_text()
                # Handle ping/pong or other messages if needed
                if data == "ping":
                    await websocket.send_text("pong")
            except WebSocketDisconnect:
                break
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        await websocket_manager.disconnect_admin(websocket, survey_id)


@router.websocket("/ws/team/survey/{invite_code}")
async def websocket_team_survey(websocket: WebSocket, invite_code: str):
    """
    WebSocket endpoint for team to receive survey updates by invite code
    """
    await websocket_manager.connect_survey(websocket, invite_code)
    
    try:
        # Send initial survey info
        db = SessionLocal()
        try:
            survey = SurveyService.get_survey_by_invite_code(db, invite_code)
            if survey:
                await websocket.send_json({
                    "type": "survey_info",
                    "data": {
                        "id": survey.id,
                        "title": survey.title,
                        "status": survey.status.value,
                        "current_stage": survey.current_stage.value
                    }
                })
        except Exception as e:
            logger.error(f"Error sending initial survey info: {e}")
        finally:
            db.close()
        
        # Keep connection alive
        while True:
            try:
                data = await websocket.receive_text()
                if data == "ping":
                    await websocket.send_text("pong")
            except WebSocketDisconnect:
                break
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        await websocket_manager.disconnect_survey(websocket, invite_code)


@router.websocket("/ws/team/{team_id}")
async def websocket_team(websocket: WebSocket, team_id: int):
    """
    WebSocket endpoint for team to receive team status updates
    """
    await websocket_manager.connect_team(websocket, team_id)
    
    try:
        # Send initial team status
        db = SessionLocal()
        try:
            status = TeamService.get_team_status(db, team_id)
            await websocket.send_json({
                "type": "team_status",
                "data": status
            })
        except Exception as e:
            logger.error(f"Error sending initial team status: {e}")
        finally:
            db.close()
        
        # Keep connection alive
        while True:
            try:
                data = await websocket.receive_text()
                if data == "ping":
                    await websocket.send_text("pong")
            except WebSocketDisconnect:
                break
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        await websocket_manager.disconnect_team(websocket, team_id)

