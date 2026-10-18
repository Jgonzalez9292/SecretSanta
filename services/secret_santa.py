import random

from models import (Assignment, ParticipantExclusion)


def generate_assignments(
    participants,
    excluded_pairs
):
    if len(participants) < 2:
        raise ValueError(
            "At least two participants are required."
        )

    participants = list(participants)

    # Randomize the starting order so repeated
    # draws do not always produce the same result.
    random.shuffle(participants)

    assignments = []
    used_receiver_ids = set()


    def find_matches(index):

        # Everyone has been assigned successfully.
        if index == len(participants):
            return True

        giver = participants[index]

        possible_receivers = [
            participant
            for participant in participants

            if participant.id != giver.id

            and participant.id
            not in used_receiver_ids

            and (
                giver.id,
                participant.id
            )
            not in excluded_pairs
        ]

        random.shuffle(
            possible_receivers
        )


        for receiver in possible_receivers:

            assignments.append(
                (giver, receiver)
            )

            used_receiver_ids.add(
                receiver.id
            )


            if find_matches(index + 1):
                return True


            assignments.pop()

            used_receiver_ids.remove(
                receiver.id
            )


        return False


    if not find_matches(0):
        raise ValueError(
            "No valid Secret Santa draw is possible "
            "with the current exclusions."
        )


    return assignments


def draw_exchange(db, exchange):

    existing_assignments = (
        db.query(Assignment)
        .filter(
            Assignment.exchange_id
            == exchange.id
        )
        .count()
    )

    if existing_assignments > 0:
        return 0


    participants = list(
        exchange.participants
    )

    if len(participants) < 2:
        raise ValueError(
            "At least two participants are required."
        )


    exclusions = (
        db.query(ParticipantExclusion)
        .filter(
            ParticipantExclusion.exchange_id
            == exchange.id
        )
        .all()
    )


    excluded_pairs = set()

    for exclusion in exclusions:

        # One database exclusion represents
        # a mutual restriction.
        excluded_pairs.add(
            (
                exclusion.participant_a_id,
                exclusion.participant_b_id
            )
        )

        excluded_pairs.add(
            (
                exclusion.participant_b_id,
                exclusion.participant_a_id
            )
        )


    matches = generate_assignments(
        participants,
        excluded_pairs
    )


    for giver, receiver in matches:

        assignment = Assignment(
            exchange_id=exchange.id,
            giver_id=giver.id,
            receiver_id=receiver.id
        )

        db.add(assignment)


    db.commit()

    return len(matches)