from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Exchange, Participant
from schemas import ParticipantCreate, ParticipantResponse


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
        .filter(Exchange.code == exchange_code)
        .first()
    )

    if exchange is None:
        raise HTTPException(
            status_code=404,
            detail="Exchange not found."
        )

    new_participant = Participant(
        exchange_id=exchange.id,
        name=participant.name,
        email=participant.email,
        wishlist=participant.wishlist,
        interests=participant.interests
    )

    db.add(new_participant)
    db.commit()
    db.refresh(new_participant)

    return new_participant