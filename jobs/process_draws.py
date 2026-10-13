import asyncio
from datetime import datetime, timezone

from database import SessionLocal
from models import Exchange, Assignment
from services.secret_santa import draw_exchange
from services.email_service import (
    send_exchange_assignment_emails
)


async def process_due_draws():
    db = SessionLocal()

    try:
        now = datetime.now(timezone.utc)

        due_exchanges = (
            db.query(Exchange)
            .filter(
                Exchange.draw_date.is_not(None),
                Exchange.draw_date <= now
            )
            .all()
        )

        print(
            f"Found {len(due_exchanges)} exchange(s) "
            f"with a draw date that has arrived."
        )

        for exchange in due_exchanges:

            existing_assignments = (
                db.query(Assignment)
                .filter(
                    Assignment.exchange_id == exchange.id
                )
                .count()
            )

            if existing_assignments == 0:

                try:
                    assignments_created = draw_exchange(
                        db,
                        exchange
                    )

                    print(
                        f"Drew {exchange.name}: "
                        f"{assignments_created} assignments created."
                    )

                except ValueError as error:
                    print(
                        f"Could not draw {exchange.name}: "
                        f"{error}"
                    )

                    continue

            else:
                print(
                    f"{exchange.name} has already been drawn."
                )

            try:
                emails_sent = (
                    await send_exchange_assignment_emails(
                        db,
                        exchange
                    )
                )

                if emails_sent > 0:
                    print(
                        f"Sent {emails_sent} assignment email(s) "
                        f"for {exchange.name}."
                    )

                else:
                    print(
                        f"No unsent assignment emails "
                        f"for {exchange.name}."
                    )

            except Exception as error:
                print(
                    f"Could not send emails for "
                    f"{exchange.name}: {error}"
                )

    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(process_due_draws())