from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import get_db
from auth import get_current_user
from models import Exchange, User
from schemas import ExchangeCreate, ExchangeResponse, ExchangeListItem


router = APIRouter(
    prefix="/api/exchanges",
    tags=["Exchanges"]
)

@router.post("/", response_model=ExchangeResponse)
def create_exchange(
    exchange: ExchangeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_exchange = Exchange(
        name=exchange.name,
        code=exchange.code,
        budget=exchange.budget,
        registration_deadline=exchange.registration_deadline,
        draw_date=exchange.draw_date,
        created_by=current_user.id
    )

    db.add(new_exchange)

    try:
        db.commit()
        db.refresh(new_exchange)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="That family code is already taken."
        )

    return new_exchange

@router.get(
    "/mine",
    response_model=list[ExchangeListItem]
)
def get_my_exchanges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exchanges = (
        db.query(Exchange)
        .filter(Exchange.created_by == current_user.id)
        .all()
    )

    return exchanges

@router.get("/{exchange_code}")
def get_exchange(
    exchange_code: str,
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

    return {
        "id": exchange.id,
        "name": exchange.name,
        "code": exchange.code,
        "budget": exchange.budget,
        "participants": [
            {
                "id": participant.id,
                "name": participant.name
            }
            for participant in exchange.participants
        ]
    }