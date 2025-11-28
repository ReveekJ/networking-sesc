from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from app.routers import quiz, team, host, answer, statistics
from app.websocket import handlers
from app.database import engine, Base
import logging

logger = logging.getLogger(__name__)

app = FastAPI(title="Quiz System API", version="1.0.0")

# Create database tables
@app.on_event("startup")
def create_tables():
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        # Don't fail startup if tables already exist
        pass

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(quiz.router)
app.include_router(team.router)
app.include_router(host.router)
app.include_router(answer.router)
app.include_router(statistics.router)


@app.websocket("/ws/{invite_code}")
async def websocket_endpoint(websocket: WebSocket, invite_code: str):
    """WebSocket endpoint for quiz synchronization."""
    await handlers.websocket_endpoint(websocket, invite_code)


@app.get("/")
def root():
    return {"message": "Quiz System API"}


@app.get("/health")
def health():
    return {"status": "ok"}

