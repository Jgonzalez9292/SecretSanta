from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import get_db
from auth import get_current_user
from models import Exchange, User, Assignment
from schemas import ExchangeCreate, ExchangeResponse, ExchangeListItem, ExchangeUpdate
from services.secret_santa import generate_assignments


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

@router.get("/manage/{exchange_id}")
def get_exchange_for_management(
    exchange_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exchange = (
        db.query(Exchange)
        .filter(
            Exchange.id == exchange_id,
            Exchange.created_by == current_user.id
        )
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
        "registration_deadline": exchange.registration_deadline,
        "draw_date": exchange.draw_date,
        "participants": [
            {
                "id": participant.id,
                "name": participant.name,
                "email": participant.email
            }
            for participant in exchange.participants
        ]
    }

@router.put("/manage/{exchange_id}")
def update_exchange(
    exchange_id: int,
    changes: ExchangeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exchange = (
        db.query(Exchange)
        .filter(
            Exchange.id == exchange_id,
            Exchange.created_by == current_user.id
        )
        .first()
    )

    if exchange is None:
        raise HTTPException(
            status_code=404,
            detail="Exchange not found."
        )

    updates = changes.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(exchange, field, value)

    db.commit()
    db.refresh(exchange)

    return {
        "id": exchange.id,
        "name": exchange.name,
        "code": exchange.code,
        "budget": exchange.budget,
        "registration_deadline": exchange.registration_deadline,
        "draw_date": exchange.draw_date
    }

@router.post("/manage/{exchange_id}/draw")
def run_draw(
    exchange_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exchange = (
        db.query(Exchange)
        .filter(
            Exchange.id == exchange_id,
            Exchange.created_by == current_user.id
        )
        .first()
    )

    if exchange is None:
        raise HTTPException(
            status_code=404,
            detail="Exchange not found."
        )

    existing_assignments = (
        db.query(Assignment)
        .filter(
            Assignment.exchange_id == exchange_id
        )
        .count()
    )

    if existing_assignments > 0:
        raise HTTPException(
            status_code=409,
            detail="This exchange has already been drawn."
        )

    participants = exchange.participants

    if len(participants) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least two participants are required."
        )

    matches = generate_assignments(participants)

    for giver, receiver in matches:
        assignment = Assignment(
            exchange_id=exchange.id,
            giver_id=giver.id,
            receiver_id=receiver.id
        )

        db.add(assignment)

    db.commit()

    return {
        "status": "success",
        "message": "Secret Santa draw completed.",
        "assignments_created": len(matches)
    }

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