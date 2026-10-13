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

const deleteExchangeButton =
    document.getElementById("delete-exchange-button");

const sendEmailsButton =
    document.getElementById("send-emails-button");


if (!exchangeId || !token) {
    window.location.href =
        "dashboard.html";
}

function toLocalDateTimeInput(isoDate) {

    if (!isoDate) {
        return "";
    }

    const date = new Date(isoDate);

    const offset =
        date.getTimezoneOffset() * 60000;

    const localDate =
        new Date(date.getTime() - offset);

    return localDate
        .toISOString()
        .slice(0, 16);
}

function formatDateTime(isoDate) {
    if (!isoDate) {
        return "Not set";
    }

    return new Date(isoDate).toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}

async function loadExchange() {

    const response = await fetch(
        `${API_BASE_URL}/api/exchanges/manage/${exchangeId}`,
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
        `Registration deadline: ${formatDateTime(exchange.registration_deadline)}`;

    document.getElementById("draw-date").textContent =
        `Draw date: ${formatDateTime(exchange.draw_date)}`;

    const drawStatus =
    document.getElementById("draw-status");

    if (exchange.drawn) {

        drawStatus.textContent =
            "Draw status: Completed";

        drawButton.disabled = true;

        drawButton.textContent =
            "Draw Completed";

    } else {

        drawStatus.textContent =
            "Draw status: Not yet drawn";

        drawButton.disabled = false;

        drawButton.textContent =
            "Run Secret Santa Draw";
    }

    const emailStatus =
        document.getElementById("email-status");

    if (!exchange.drawn) {

        emailStatus.textContent =
            "Email status: Waiting for draw";

        sendEmailsButton.disabled = true;

    } else if (exchange.emails_sent) {

        emailStatus.textContent =
            "Email status: Sent";

        sendEmailsButton.disabled = true;

        sendEmailsButton.textContent =
            "Assignment Emails Sent";

    } else {

        emailStatus.textContent =
            "Email status: Not sent";

        sendEmailsButton.disabled = false;

        sendEmailsButton.textContent =
            "Send Assignment Emails";
    }

    editName.value =
        exchange.name ?? "";

    editBudget.value =
        exchange.budget ?? "";

    editRegistrationDeadline.value =
        toLocalDateTimeInput(
            exchange.registration_deadline
        );

    editDrawDate.value =
        toLocalDateTimeInput(
            exchange.draw_date
        );


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
            editRegistrationDeadline.value
                ? new Date(
                    editRegistrationDeadline.value
                ).toISOString()
                : null,

        draw_date:
            editDrawDate.value
                ? new Date(
                    editDrawDate.value
                ).toISOString()
                : null
    };
    console.log(updates);


    const response = await fetch(
        `${API_BASE_URL}/api/exchanges/manage/${exchangeId}`,
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
            `${API_BASE_URL}/api/participants/${participantId}`,
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
            `${API_BASE_URL}/api/exchanges/manage/${exchangeId}/draw`,
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

        await loadExchange();
    });

    deleteExchangeButton.addEventListener("click", async () => {

        const confirmed = confirm(
            "Delete this exchange? This will permanently remove the exchange, its participants, and its Secret Santa assignments."
        );

        if (!confirmed) {
            return;
        }

        const response = await fetch(
            `${API_BASE_URL}/api/exchanges/manage/${exchangeId}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            message.textContent =
                data.detail || "Could not delete exchange.";

            return;
        }

        window.location.href =
            "dashboard.html";
    });

    sendEmailsButton.addEventListener("click", async () => {

        const confirmed = confirm(
            "Send Secret Santa assignment emails to everyone in this exchange?"
        );

        if (!confirmed) {
            return;
        }

        const response = await fetch(
            `${API_BASE_URL}/api/exchanges/manage/${exchangeId}/send-emails`,
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
                data.detail || "Could not send assignment emails.";

            return;
        }

        message.textContent =
            data.message;

        await loadExchange();
    });

loadExchange();