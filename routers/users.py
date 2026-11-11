import hashlib
import secrets

from datetime import (
    datetime,
    timedelta,
    timezone
)

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import get_db

from models import User

from schemas import (
    UserCreate,
    UserResponse,
    UserLogin,
    LoginResponse,
    PasswordResetRequest,
    PasswordResetConfirm,
    ChangePasswordRequest
)

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)

from services.email_service import (
    send_test_email,
    send_password_reset_email
)


router = APIRouter(
    prefix="/api/users",
    tags=["Users"]
)


def hash_reset_token(
    token: str
) -> str:

    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()


@router.post("/test-email")
async def test_email(current_user: User = Depends(get_current_user)):
    result = await send_test_email(
        "delivered@resend.dev"
    )

    return {
        "status": "success",
        "email_id": result["id"]
    }


@router.post(
    "/login",
    response_model=LoginResponse
)
def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(
            User.email ==
            credentials.email.lower()
        )
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    if not verify_password(
        credentials.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    token = create_access_token(user.id)

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@router.post(
    "/signup",
    response_model=UserResponse
)
def signup(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    if len(user.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters."
        )

    new_user = User(
        name=user.name,
        email=user.email.lower(),
        password_hash=
            hash_password(
                user.password
            )
    )

    db.add(
        new_user
    )

    try:

        db.commit()
        db.refresh(
            new_user
        )

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=
                "An account with that email already exists."
        )

    return new_user


@router.post(
    "/forgot-password"
)
async def forgot_password(
    request: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    generic_response = {
        "message":
            "If an account exists for that email, "
            "a password reset link has been sent."
    }


    email = request.email.strip().lower()


    user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )


    if user is None:
        return generic_response


    reset_token = secrets.token_urlsafe(32)


    user.password_reset_token_hash = hash_reset_token(
            reset_token
        )


    user.password_reset_token_expires_at = (
        datetime.now(
            timezone.utc
        )
        +
        timedelta(
            minutes=30
        )
    )


    db.commit()


    try:

        await send_password_reset_email(
            user_email=user.email,
            user_name=user.name,
            reset_token=reset_token
        )

    except Exception as error:

        print(
            "Password reset email failed:",
            error
        )


    return generic_response


@router.post(
    "/reset-password"
)
def reset_password(
    request: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    if len(request.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters."
        )

    token_hash = hash_reset_token(
        request.token
    )

    user = (
        db.query(User)
        .filter(
            User.password_reset_token_hash
            == token_hash
        )
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=400,
            detail="This password reset link is invalid or has expired."
        )

    expires_at = user.password_reset_token_expires_at

    if (
        expires_at is None
        or expires_at <= datetime.now(timezone.utc)
    ):
        user.password_reset_token_hash = None
        user.password_reset_token_expires_at = None

        db.commit()

        raise HTTPException(
            status_code=400,
            detail="This password reset link is invalid or has expired."
        )

    user.password_hash = hash_password(
        request.password
    )

    user.password_reset_token_hash = None
    user.password_reset_token_expires_at = None

    db.commit()

    return {
        "message":
            "Your password has been reset successfully."
    }

@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(
        request.current_password,
        current_user.password_hash
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect."
        )

    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="New password must be at least 8 characters."
        )

    if verify_password(
        request.new_password,
        current_user.password_hash
    ):
        raise HTTPException(
            status_code=400,
            detail="New password must be different from your current password."
        )

    current_user.password_hash = hash_password(
        request.new_password
    )

    db.commit()

    return {
        "message": "Password changed successfully."
    }

@router.get(
    "/me",
    response_model=UserResponse
)
def get_me(
    current_user: User = Depends(
        get_current_user
    )
):
    return current_user