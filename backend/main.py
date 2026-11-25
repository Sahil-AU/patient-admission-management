from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi import HTTPException
from starlette.middleware.cors import CORSMiddleware

from routes import router as patients_router
from database import (
    close_database_connection,
    connect_to_database,
    check_database_connection,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    connect_to_database()
    yield
    close_database_connection()


app = FastAPI(title="Patient Admission Management API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://frontend-git-main-sahilak73984-5611s-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Accept", "Content-Type"],
)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/db-health")
def database_health_check():
    is_connected, message = check_database_connection()
    if not is_connected:
        raise HTTPException(status_code=503, detail=message)

    return {
        "status": "ok",
        "database": "connected",
        "database_name": "hospital_management",
        "collection": "patients",
    }


app.include_router(patients_router)
