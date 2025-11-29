from typing import Dict, Set
from fastapi import WebSocket
import json
import logging
import asyncio
import threading

logger = logging.getLogger(__name__)


class WebSocketManager:
    """
    Manager for WebSocket connections
    """
    def __init__(self):
        # survey_id -> Set[WebSocket]
        self.admin_connections: Dict[int, Set[WebSocket]] = {}
        # invite_code -> Set[WebSocket]
        self.survey_connections: Dict[str, Set[WebSocket]] = {}
        # team_id -> Set[WebSocket]
        self.team_connections: Dict[int, Set[WebSocket]] = {}
    
    async def connect_admin(self, websocket: WebSocket, survey_id: int):
        """
        Connect admin WebSocket for survey
        """
        await websocket.accept()
        if survey_id not in self.admin_connections:
            self.admin_connections[survey_id] = set()
        self.admin_connections[survey_id].add(websocket)
        logger.info(f"Admin connected to survey {survey_id}")
    
    async def disconnect_admin(self, websocket: WebSocket, survey_id: int):
        """
        Disconnect admin WebSocket
        """
        if survey_id in self.admin_connections:
            self.admin_connections[survey_id].discard(websocket)
            if not self.admin_connections[survey_id]:
                del self.admin_connections[survey_id]
        logger.info(f"Admin disconnected from survey {survey_id}")
    
    async def connect_survey(self, websocket: WebSocket, invite_code: str):
        """
        Connect WebSocket for survey by invite code
        """
        await websocket.accept()
        if invite_code not in self.survey_connections:
            self.survey_connections[invite_code] = set()
        self.survey_connections[invite_code].add(websocket)
        logger.info(f"Client connected to survey {invite_code}")
    
    async def disconnect_survey(self, websocket: WebSocket, invite_code: str):
        """
        Disconnect WebSocket for survey
        """
        if invite_code in self.survey_connections:
            self.survey_connections[invite_code].discard(websocket)
            if not self.survey_connections[invite_code]:
                del self.survey_connections[invite_code]
        logger.info(f"Client disconnected from survey {invite_code}")
    
    async def connect_team(self, websocket: WebSocket, team_id: int):
        """
        Connect WebSocket for team
        """
        await websocket.accept()
        if team_id not in self.team_connections:
            self.team_connections[team_id] = set()
        self.team_connections[team_id].add(websocket)
        logger.info(f"Team {team_id} connected")
    
    async def disconnect_team(self, websocket: WebSocket, team_id: int):
        """
        Disconnect WebSocket for team
        """
        if team_id in self.team_connections:
            self.team_connections[team_id].discard(websocket)
            if not self.team_connections[team_id]:
                del self.team_connections[team_id]
        logger.info(f"Team {team_id} disconnected")
    
    async def send_to_admins(self, survey_id: int, message: dict):
        """
        Send message to all admin connections for survey
        """
        if survey_id not in self.admin_connections:
            return
        
        disconnected = set()
        for websocket in self.admin_connections[survey_id]:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error sending to admin: {e}")
                disconnected.add(websocket)
        
        # Remove disconnected websockets
        for ws in disconnected:
            self.admin_connections[survey_id].discard(ws)
    
    async def send_to_survey(self, invite_code: str, message: dict):
        """
        Send message to all connections for survey
        """
        if invite_code not in self.survey_connections:
            return
        
        disconnected = set()
        for websocket in self.survey_connections[invite_code]:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error sending to survey: {e}")
                disconnected.add(websocket)
        
        # Remove disconnected websockets
        for ws in disconnected:
            self.survey_connections[invite_code].discard(ws)
    
    async def send_to_team(self, team_id: int, message: dict):
        """
        Send message to all connections for team
        """
        if team_id not in self.team_connections:
            return
        
        disconnected = set()
        for websocket in self.team_connections[team_id]:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error sending to team: {e}")
                disconnected.add(websocket)
        
        # Remove disconnected websockets
        for ws in disconnected:
            self.team_connections[team_id].discard(ws)


# Global WebSocket manager instance
websocket_manager = WebSocketManager()


def run_async_in_thread(coro):
    """
    Run async coroutine in a separate thread
    """
    def run_in_thread():
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(coro)
            loop.close()
        except Exception as e:
            logger.error(f"Error running async task: {e}")
    
    thread = threading.Thread(target=run_in_thread, daemon=True)
    thread.start()

