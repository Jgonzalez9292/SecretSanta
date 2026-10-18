from pydantic import BaseModel, model_validator
from datetime import datetime
from decimal import Decimal


class ExchangeCreate(BaseModel):
    name: str
    code: str
    budget: Decimal | None = None
    registration_deadline: datetime | None = None
    draw_date: datetime | None = None

    @model_validator(mode="after")
    def validate_dates(self):

        now = datetime.now().astimezone()

        if (
            self.registration_deadline is not None
            and self.registration_deadline <= now
        ):
            raise ValueError(
                "Registration deadline must be in the future."
            )

        if (
            self.draw_date is not None
            and self.draw_date <= now
        ):
            raise ValueError(
                "Draw date must be in the future."
            )

        if (
            self.registration_deadline is not None
            and self.draw_date is not None
            and self.registration_deadline >= self.draw_date
        ):
            raise ValueError(
                "Registration deadline must be before the draw date."
            )

        return self


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