import os
from html import escape

import resend
from dotenv import load_dotenv
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from urllib.parse import quote

from models import Assignment, Participant


load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")

EMAIL_TEST_MODE = (
    os.getenv("EMAIL_TEST_MODE", "true").lower()
    == "true"
)

EMAIL_TEST_RECIPIENT = os.getenv(
    "EMAIL_TEST_RECIPIENT",
    "delivered@resend.dev"
)

EMAIL_FROM = os.getenv(
    "EMAIL_FROM",
    "Secret Santa <onboarding@resend.dev>"
)

APP_TIMEZONE = ZoneInfo(
    os.getenv(
        "APP_TIMEZONE",
        "America/New_York"
    )
)

APP_BASE_URL = os.getenv(
    "APP_BASE_URL",
    "https://secretsanta.page"
).rstrip("/")

def format_event_time(value):

    if value is None:
        return "Not specified"

    local_time = value.astimezone(
        APP_TIMEZONE
    )

    return local_time.strftime(
        "%B %d, %Y at %I:%M %p %Z"
    ).replace(" 0", " ")



async def send_test_email(to_email: str):

    recipient = (
        EMAIL_TEST_RECIPIENT
        if EMAIL_TEST_MODE
        else to_email
    )

    params: resend.Emails.SendParams = {
        "from": EMAIL_FROM,
        "to": [recipient],
        "subject": "Secret Santa Email Test",
        "html": """
            <h1>Secret Santa</h1>
            <p>If you received this, email sending is working.</p>
        """
    }

    return await resend.Emails.send_async(params)

async def send_registration_confirmation_email(
    participant_email: str,
    participant_name: str,
    exchange_name: str,
    budget,
    registration_deadline,
    draw_date,
    verification_token: str
):

    recipient = (
        EMAIL_TEST_RECIPIENT
        if EMAIL_TEST_MODE
        else participant_email
    )

    safe_participant_name = escape(
        participant_name
    )

    safe_exchange_name = escape(
        exchange_name
    )

    budget_text = (
        f"${budget}"
        if budget is not None
        else "No budget specified"
    )

    registration_text = format_event_time(
        registration_deadline
    )

    draw_text = format_event_time(
        draw_date
    )

    verification_url = (
        f"{APP_BASE_URL}/verify.html"
        f"?token={quote(verification_token)}"
    )

    safe_verification_url = escape(
        verification_url,
        quote=True
    )

    html = f"""
        <h1>Confirm your Secret Santa registration 🎄</h1>

        <p>
            Hey {safe_participant_name}!
        </p>

        <p>
            We received your submission for
            <strong>{safe_exchange_name}</strong>.
        </p>

        <p>
            <strong>Budget:</strong>
            {budget_text}
        </p>

        <p>
            <strong>Registration closes:</strong>
            {registration_text}
        </p>

        <p>
            <strong>Secret Santa draw:</strong>
            {draw_text}
        </p>

        <p>
            Confirm your email address to complete
            your registration.
        </p>

        <p>
            <a
                href="{safe_verification_url}"
                style="
                    display: inline-block;
                    padding: 12px 20px;
                    background: #174a34;
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: bold;
                "
            >
                Confirm Registration
            </a>
        </p>

        <p>
            This confirmation link expires in 24 hours.
        </p>

        <p>
            Once you're confirmed, we'll email your
            Secret Santa assignment after the draw.
        </p>
    """

    params: resend.Emails.SendParams = {
        "from": EMAIL_FROM,
        "to": [recipient],
        "subject":
            f"🎄 You're registered for {exchange_name}",
        "html": html
    }

    return await resend.Emails.send_async(
        params
    )



async def send_assignment_email(
    giver_email: str,
    giver_name: str,
    receiver_name: str,
    exchange_name: str,
    budget,
    wishlist: str | None,
    interests: str | None
):

    recipient = (
        EMAIL_TEST_RECIPIENT
        if EMAIL_TEST_MODE
        else giver_email
    )

    safe_giver_name = escape(giver_name)
    safe_receiver_name = escape(receiver_name)
    safe_exchange_name = escape(exchange_name)

    safe_wishlist = escape(
        wishlist or "No wishlist provided."
    )

    safe_interests = escape(
        interests or "No interests provided."
    )

    budget_text = (
        f"${budget}"
        if budget is not None
        else "No budget specified"
    )

    html = f"""
        <h1>Secret Santa 🎄</h1>

        <p>Hey {safe_giver_name}!</p>

        <p>
            Your Secret Santa assignment for
            <strong>{safe_exchange_name}</strong> is:
        </p>

        <h2>{safe_receiver_name}</h2>

        <p>
            <strong>Budget:</strong>
            {budget_text}
        </p>

        <h3>Things they like</h3>

        <p>{safe_interests}</p>

        <h3>Wishlist / gift ideas</h3>

        <p>{safe_wishlist}</p>

        <p>
            Keep it secret! 🎅
        </p>
    """

    params: resend.Emails.SendParams = {
        "from": EMAIL_FROM,
        "to": [recipient],
        "subject": f"🎅 Your {exchange_name} Secret Santa Assignment",
        "html": html
    }

    return await resend.Emails.send_async(params)

async def send_exchange_assignment_emails(
    db,
    exchange
):
    assignments = (
        db.query(Assignment)
        .filter(
            Assignment.exchange_id == exchange.id,
            Assignment.email_sent_at.is_(None)
        )
        .all()
    )

    emails_sent = 0

    for assignment in assignments:

        giver = db.get(
            Participant,
            assignment.giver_id
        )

        receiver = db.get(
            Participant,
            assignment.receiver_id
        )

        if giver is None or receiver is None:
            continue

        result = await send_assignment_email(
            giver_email=giver.email,
            giver_name=giver.name,
            receiver_name=receiver.name,
            exchange_name=exchange.name,
            budget=exchange.budget,
            wishlist=receiver.wishlist,
            interests=receiver.interests
        )

        assignment.email_sent_at = datetime.now(timezone.utc)

        assignment.email_id = result["id"]

        db.commit()

        emails_sent += 1

    return emails_sent