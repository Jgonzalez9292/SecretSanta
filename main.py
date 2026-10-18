from fastapi import FastAPI
from sqlalchemy import text

from database import engine, Base
import models

from routers import exchanges, participants, users

from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(exchanges.router)
app.include_router(participants.router)
app.include_router(users.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://jgonzalez9292.github.io",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "Secret Santa API is running"
    }


@app.get("/api/test-db")
def test_database():
    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT current_database(), current_user")
        )

        row = result.fetchone()

    return {
        "database": row[0],
        "user": row[1]
    }