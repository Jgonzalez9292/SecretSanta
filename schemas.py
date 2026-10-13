from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal


class ExchangeCreate(BaseModel):
    name: str
    code: str
    budget: Decimal | None = None
    registration_deadline: datetime | None = None
    draw_date: datetime | None = None


class ExchangeResponse(BaseModel):
    id: int
    name: str
    code: str
    budget: Decimal | None
    registration_deadline: datetime | None
    draw_date: datetime | None

    class Config:
        from_attributes = True

class ParticipantCreate(BaseModel):
    name: str
    email: str
    wishlist: str | None = None
    interests: str | None = None


class ParticipantResponse(BaseModel):
    id: int
    exchange_id: int
    name: str
    email: str
    wishlist: str | None = None
    interests: str | None = None

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    name: str
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str

class ExchangeListItem(BaseModel):
    id: int
    name: str
    code: str
    budget: Decimal | None = None
    registration_deadline: datetime | None = None
    draw_date: datetime | None = None

    class Config:
        from_attributes = True

class ExchangeUpdate(BaseModel):
    name: str | None = None
    budget: Decimal | None = None
    registration_deadline: datetime | None = None
    draw_date: datetime | None = None