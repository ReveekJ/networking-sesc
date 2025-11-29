from fastapi import WebSocket, WebSocketDisconnect
from app.websocket.manager import manager


async def websocket_endpoint(websocket: WebSocket, invite_code: str):
    """WebSocket endpoint for quiz synchronization."""
    await manager.connect(websocket, invite_code)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            # Echo back or handle specific messages if needed
            await websocket.send_json({"type": "pong", "message": "Connection active"})
    except WebSocketDisconnect:
        manager.disconnect(websocket, invite_code)


async def broadcast_quiz_started(invite_code: str):
    """Broadcast quiz started event."""
    await manager.broadcast_to_quiz({
        "type": "quiz_started",
        "message": "Quiz has started"
    }, invite_code)


async def broadcast_question_changed(invite_code: str, question_order: int):
    """Broadcast question changed event."""
    await manager.broadcast_to_quiz({
        "type": "question_changed",
        "question_order": question_order,
        "message": "Question changed"
    }, invite_code)


async def broadcast_team_joined(invite_code: str, team_name: str):
    """Broadcast team joined event."""
    await manager.broadcast_to_quiz({
        "type": "team_joined",
        "team_name": team_name,
        "message": f"Team {team_name} joined"
    }, invite_code)


async def broadcast_answer_submitted(invite_code: str, participant_id: str):
    """Broadcast answer submitted event."""
    await manager.broadcast_to_quiz({
        "type": "answer_submitted",
        "participant_id": participant_id,
        "message": "Answer submitted"
    }, invite_code)


async def broadcast_quiz_completed(invite_code: str):
    """Broadcast quiz completed event."""
    await manager.broadcast_to_quiz({
        "type": "quiz_completed",
        "message": "Quiz has been completed"
    }, invite_code)

