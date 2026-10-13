const params =
    new URLSearchParams(window.location.search);

const exchangeId =
    params.get("id");

const token =
    localStorage.getItem("access_token");

const editButton =
    document.getElementById("edit-button");

const editForm =
    document.getElementById("edit-form");

const editName =
    document.getElementById("edit-name");

const editBudget =
    document.getElementById("edit-budget");

const editRegistrationDeadline =
    document.getElementById("edit-registration-deadline");

const editDrawDate =
    document.getElementById("edit-draw-date");

const message =
    document.getElementById("message");

const drawButton =
    document.getElementById("draw-button");


if (!exchangeId || !token) {
    window.location.href =
        "dashboard.html";
}


async function loadExchange() {

    const response = await fetch(
        `http://127.0.0.1:8000/api/exchanges/manage/${exchangeId}`,
        {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        }
    );


    if (!response.ok) {
        message.textContent =
            "Could not load exchange.";

        return;
    }


    const exchange =
        await response.json();


    document.getElementById("exchange-name").textContent =
        exchange.name;

    document.getElementById("exchange-code").textContent =
        `Code: ${exchange.code}`;

    document.getElementById("exchange-budget").textContent =
        `Budget: $${exchange.budget ?? "Not set"}`;

    document.getElementById("registration-deadline").textContent =
        `Registration deadline: ${exchange.registration_deadline ?? "Not set"}`;

    document.getElementById("draw-date").textContent =
        `Draw date: ${exchange.draw_date ?? "Not set"}`;


    editName.value =
        exchange.name ?? "";

    editBudget.value =
        exchange.budget ?? "";

    editRegistrationDeadline.value =
        exchange.registration_deadline
            ? exchange.registration_deadline.slice(0, 16)
            : "";

    editDrawDate.value =
        exchange.draw_date
            ? exchange.draw_date.slice(0, 16)
            : "";


    const participantList =
        document.getElementById("participant-list");

    participantList.innerHTML = "";


    if (exchange.participants.length === 0) {

        participantList.textContent =
            "No participants have joined yet.";

        return;
    }


    exchange.participants.forEach(participant => {

        const item =
            document.createElement("div");

        item.innerHTML = `
            <p>
                <strong>${participant.name}</strong><br>
                ${participant.email}
            </p>

            <button
                class="remove-participant"
                data-participant-id="${participant.id}"
            >
                Remove
            </button>
        `;

        participantList.appendChild(item);
    });
}


editButton.addEventListener("click", () => {
    editForm.hidden =
        !editForm.hidden;
});


editForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    const updates = {
        name:
            editName.value.trim() || null,

        budget:
            editBudget.value
                ? Number(editBudget.value)
                : null,

        registration_deadline:
            editRegistrationDeadline.value || null,

        draw_date:
            editDrawDate.value || null
    };


    const response = await fetch(
        `http://127.0.0.1:8000/api/exchanges/manage/${exchangeId}`,
        {
            method: "PUT",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify(updates)
        }
    );


    if (!response.ok) {

        message.textContent =
            "Could not update exchange.";

        return;
    }


    message.textContent =
        "Exchange updated successfully.";

    editForm.hidden =
        true;

    await loadExchange();
});

document
    .getElementById("participant-list")
    .addEventListener("click", async (event) => {

        if (!event.target.classList.contains("remove-participant")) {
            return;
        }

        const participantId =
            event.target.dataset.participantId;

        const confirmed =
            confirm("Remove this participant from the exchange?");

        if (!confirmed) {
            return;
        }

        const response = await fetch(
            `http://127.0.0.1:8000/api/participants/${participantId}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            message.textContent =
                "Could not remove participant.";

            return;
        }

        message.textContent =
            "Participant removed.";

        await loadExchange();
    });

    drawButton.addEventListener("click", async () => {

        const confirmed =
            confirm(
                "Run the Secret Santa draw? This cannot be run again unless the assignments are cleared."
            );

        if (!confirmed) {
            return;
        }

        const response = await fetch(
            `http://127.0.0.1:8000/api/exchanges/manage/${exchangeId}/draw`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            message.textContent =
                data.detail || "Could not run draw.";

            return;
        }

        message.textContent =
            `Draw complete. ${data.assignments_created} assignments created.`;
    });

loadExchange();