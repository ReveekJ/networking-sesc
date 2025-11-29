from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.api.admin import surveys, dashboard
from app.api.teams import registration, survey
from app.api import websocket

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name, debug=settings.debug)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Admin routes
app.include_router(surveys.router, prefix="/api/admin", tags=["admin"])
app.include_router(dashboard.router, prefix="/api/admin", tags=["admin"])

# Team routes
app.include_router(registration.router, prefix="/api/teams", tags=["teams"])
app.include_router(survey.router, prefix="/api/teams", tags=["teams"])

# WebSocket routes
app.include_router(websocket.router, tags=["websocket"])


@app.get("/")
def root():
    return {"message": "Survey System API"}


@app.get("/health")
def health():
    return {"status": "ok"}

