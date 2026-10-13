from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timezone

from database import get_db
from auth import get_current_user
from models import Exchange, User, Assignment, Participant
from schemas import ExchangeCreate, ExchangeResponse, ExchangeListItem, ExchangeUpdate
from services.secret_santa import generate_assignments, draw_exchange
from services.email_service import send_assignment_email, send_exchange_assignment_emails


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

    assignment_count = (
        db.query(Assignment)
        .filter(Assignment.exchange_id == exchange.id)
        .count()
    )

    drawn = assignment_count > 0

    email_count = (
        db.query(Assignment)
        .filter(
            Assignment.exchange_id == exchange.id,
            Assignment.email_sent_at.is_not(None)
        )
        .count()
    )

    assignment_count = (
        db.query(Assignment)
        .filter(
            Assignment.exchange_id == exchange.id
        )
        .count()
    )

    emails_sent = (
            assignment_count > 0
            and email_count == assignment_count
    )

    return {
        "id": exchange.id,
        "name": exchange.name,
        "code": exchange.code,
        "budget": exchange.budget,
        "registration_deadline": exchange.registration_deadline,
        "draw_date": exchange.draw_date,
        "drawn": drawn,
        "emails_sent": emails_sent,
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

    try:
        assignments_created = draw_exchange(
            db,
            exchange
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    if assignments_created == 0:
        raise HTTPException(
            status_code=409,
            detail="This exchange has already been drawn."
        )

    return {
        "status": "success",
        "message": "Secret Santa draw completed.",
        "assignments_created": assignments_created
    }

@router.delete("/manage/{exchange_id}")
def delete_exchange(
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

    db.delete(exchange)
    db.commit()

    return {
        "status": "success",
        "message": "Exchange deleted."
    }

@router.post("/manage/{exchange_id}/send-emails")
async def send_assignment_emails(
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

    assignment_count = (
        db.query(Assignment)
        .filter(
            Assignment.exchange_id == exchange.id
        )
        .count()
    )

    if assignment_count == 0:
        raise HTTPException(
            status_code=400,
            detail="This exchange has not been drawn yet."
        )

    emails_sent = await send_exchange_assignment_emails(
        db,
        exchange
    )

    if emails_sent == 0:
        return {
            "status": "success",
            "message": "All assignment emails have already been sent.",
            "emails_sent": 0
        }

    return {
        "status": "success",
        "message": "Assignment emails sent.",
        "emails_sent": emails_sent
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
    registration_closed = (
            exchange.registration_deadline is not None
            and datetime.now() > exchange.registration_deadline
    )

    return {
        "id": exchange.id,
        "name": exchange.name,
        "code": exchange.code,
        "budget": exchange.budget,
        "registration_deadline": exchange.registration_deadline,
        "registration_closed": registration_closed,
        "participants": [
            {
                "id": participant.id,
                "name": participant.name
            }
            for participant in exchange.participants
        ]
    }