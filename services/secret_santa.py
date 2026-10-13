import random


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