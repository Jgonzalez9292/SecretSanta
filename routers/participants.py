from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import get_db
from models import Exchange, Participant, User, Assignment
from schemas import ParticipantCreate, ParticipantResponse
from auth import get_current_user
from datetime import datetime, timezone


router = APIRouter(
    prefix="/api/participants",
    tags=["Participants"]
)


@router.post(
    "/join/{exchange_code}",
    response_model=ParticipantResponse
)
def join_exchange(
    exchange_code: str,
    participant: ParticipantCreate,
    db: Session = Depends(get_db)
):
    exchange = (
        db.query(Exchange)
        .filter(
            Exchange.code == exchange_code.strip().upper()
        )
        .first()
    )

    if exchange is None:
        raise HTTPException(
            status_code=404,
            detail="Exchange not found."
        )

    if (
            exchange.registration_deadline is not None
            and datetime.now(timezone.utc) > exchange.registration_deadline
    ):
        raise HTTPException(
            status_code=403,
            detail="Registration for this exchange has closed."
        )

    exchange_has_been_drawn = (
        db.query(Assignment)
        .filter(Assignment.exchange_id == exchange.id)
        .first()
        is not None
    )

    if exchange_has_been_drawn:
        raise HTTPException(
            status_code=403,
            detail="Registration for this exchange has closed."
        )

    normalized_email = (
        participant.email
        .strip()
        .lower()
    )

    existing_participant = (
        db.query(Participant)
        .filter(
            Participant.exchange_id == exchange.id,
            Participant.email == normalized_email
        )
        .first()
    )

    if existing_participant is not None:
        raise HTTPException(
            status_code=409,
            detail="This email has already joined this exchange."
        )

    new_participant = Participant(
        exchange_id=exchange.id,
        name=participant.name,
        email=normalized_email,
        wishlist=participant.wishlist,
        interests=participant.interests
    )

    db.add(new_participant)

    try:
        db.commit()
        db.refresh(new_participant)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="This email has already joined this exchange."
        )

    return new_participant

@router.delete("/{participant_id}")
def delete_participant(
    participant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    participant = (
        db.query(Participant)
        .join(Exchange)
        .filter(
            Participant.id == participant_id,
            Exchange.created_by == current_user.id
        )
        .first()
    )

    if participant is None:
        raise HTTPException(
            status_code=404,
            detail="Participant not found."
        )

    exchange_has_been_drawn = (
        db.query(Assignment)
        .filter(
            Assignment.exchange_id == participant.exchange_id
        )
        .first()
        is not None
    )

    if exchange_has_been_drawn:
        raise HTTPException(
            status_code=409,
            detail="Participants cannot be removed after the draw."
        )

    db.delete(participant)
    db.commit()

    return {
        "status": "success",
        "message": "Participant removed."
    }