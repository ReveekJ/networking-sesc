from typing import Dict, Set
from fastapi import WebSocket
import json


class ConnectionManager:
    """Manages WebSocket connections for quiz synchronization."""
    
    def __init__(self):
        # Map of invite_code -> set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, invite_code: str):
        """Accept a WebSocket connection."""
        await websocket.accept()
        if invite_code not in self.active_connections:
            self.active_connections[invite_code] = set()
        self.active_connections[invite_code].add(websocket)
    
    def disconnect(self, websocket: WebSocket, invite_code: str):
        """Remove a WebSocket connection."""
        if invite_code in self.active_connections:
            self.active_connections[invite_code].discard(websocket)
            if not self.active_connections[invite_code]:
                del self.active_connections[invite_code]
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send a message to a specific connection."""
        await websocket.send_json(message)
    
    async def broadcast_to_quiz(self, message: dict, invite_code: str):
        """Broadcast a message to all connections for a quiz."""
        if invite_code in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[invite_code]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.add(connection)
            
            # Remove disconnected connections
            for connection in disconnected:
                self.active_connections[invite_code].discard(connection)


# Global manager instance
manager = ConnectionManager()

