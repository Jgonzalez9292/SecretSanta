from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    DateTime,
    ForeignKey,
    Text
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class Exchange(Base):
    __tablename__ = "exchanges"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(100),
        nullable=False
    )

    code = Column(
        String(30),
        unique=True,
        nullable=False,
        index=True
    )

    budget = Column(
        Numeric(10, 2),
        nullable=True
    )

    registration_deadline = Column(
        DateTime(timezone=True),
        nullable=True
    )

    draw_date = Column(
        DateTime(timezone=True),
        nullable=True
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    participants = relationship(
        "Participant",
        back_populates="exchange",
        cascade="all, delete-orphan"
    )

    organizer = relationship(
        "User",
        back_populates="exchanges"
    )

class Participant(Base):
    __tablename__ = "participants"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    exchange_id = Column(
        Integer,
        ForeignKey("exchanges.id", ondelete="CASCADE"),
        nullable=False
    )

    name = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(255),
        nullable=False
    )

    wishlist = Column(
        Text,
        nullable=True
    )

    interests = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    exchange = relationship(
        "Exchange",
        back_populates="participants"
    )

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    exchanges = relationship(
        "Exchange",
        back_populates="organizer",
        cascade="all, delete-orphan"
    )

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    exchange_id = Column(
        Integer,
        ForeignKey("exchanges.id", ondelete="CASCADE"),
        nullable=False
    )

    giver_id = Column(
        Integer,
        ForeignKey("participants.id", ondelete="CASCADE"),
        nullable=False
    )

    receiver_id = Column(
        Integer,
        ForeignKey("participants.id", ondelete="CASCADE"),
        nullable=False
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    email_sent_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    email_id = Column(
        String(255),
        nullable=True
    )