import random
from models import Assignment


def generate_assignments(participants):
    if len(participants) < 2:
        raise ValueError(
            "At least two participants are required."
        )

    receivers = participants.copy()

    while True:
        random.shuffle(receivers)

        valid = all(
            giver.id != receiver.id
            for giver, receiver
            in zip(participants, receivers)
        )

        if valid:
            break

    return list(zip(participants, receivers))

def draw_exchange(db, exchange):
    existing_assignments = (
        db.query(Assignment)
        .filter(
            Assignment.exchange_id == exchange.id
        )
        .count()
    )

    if existing_assignments > 0:
        return 0

    participants = exchange.participants

    if len(participants) < 2:
        raise ValueError(
            "At least two participants are required."
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

    return len(matches)