from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import hashlib
import secrets


from database import get_db
from models import Exchange, Participant, User, Assignment
from schemas import ParticipantCreate, ParticipantResponse
from auth import get_current_user
from datetime import datetime, timezone, timedelta
from services.email_service import (
    send_registration_confirmation_email
)


router = APIRouter(
    prefix="/api/participants",
    tags=["Participants"]
)

def hash_token(token: str) -> str:
    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()


@router.post(
    "/join/{exchange_code}",
    response_model=ParticipantResponse
)
async def join_exchange(
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

    verification_token = secrets.token_urlsafe(32)

    management_token = secrets.token_urlsafe(32)

    now = datetime.now(timezone.utc)

    verification_expires_at = now + timedelta(hours=24)

    new_participant = Participant(
        exchange_id=exchange.id,
        name=participant.name,
        email=normalized_email,
        wishlist=participant.wishlist,
        interests=participant.interests,

        email_verified_at=None,

        verification_token_hash=hash_token(
            verification_token
        ),

        verification_token_expires_at=
        verification_expires_at,

        verification_sent_at=now,

        management_token_hash=hash_token(
            management_token
        )
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

    try:
        await send_registration_confirmation_email(
            participant_email=new_participant.email,
            participant_name=new_participant.name,
            exchange_name=exchange.name,
            budget=exchange.budget,
            registration_deadline=exchange.registration_deadline,
            draw_date=exchange.draw_date,
            verification_token=verification_token
        )

    except Exception as error:
        print(
            f"Could not send registration confirmation "
            f"to {new_participant.email}: {error}"
        )

    return new_participant

@router.post("/verify")
def verify_registration(
    token: str,
    db: Session = Depends(get_db)
):
    token_hash = hash_token(token)

    participant = (
        db.query(Participant)
        .filter(
            Participant.verification_token_hash
            == token_hash
        )
        .first()
    )

    if participant is None:
        raise HTTPException(
            status_code=400,
            detail="This verification link is invalid."
        )

    now = datetime.now(timezone.utc)

    if (
        participant.verification_token_expires_at
        is None
        or participant.verification_token_expires_at
        < now
    ):
        raise HTTPException(
            status_code=400,
            detail="This verification link has expired."
        )

    exchange = participant.exchange

    if (
        exchange.registration_deadline is not None
        and now > exchange.registration_deadline
    ):
        raise HTTPException(
            status_code=403,
            detail="Registration for this exchange has closed."
        )


    exchange_has_been_drawn = (
        db.query(Assignment)
        .filter(
            Assignment.exchange_id
            == exchange.id
        )
        .first()
        is not None
    )

    if exchange_has_been_drawn:
        raise HTTPException(
            status_code=403,
            detail="Registration for this exchange has closed."
        )

    participant.email_verified_at = now
    participant.verification_token_hash = None
    participant.verification_token_expires_at = None

    db.commit()

    return {
        "status": "success",
        "message": "Registration confirmed."
    }

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