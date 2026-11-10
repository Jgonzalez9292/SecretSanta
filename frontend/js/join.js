const params =
    new URLSearchParams(window.location.search);

const sharedCode =
    params.get("code");

const exchangeName =
    document.getElementById("exchange-name");

const exchangeBudget =
    document.getElementById("exchange-budget");

const form =
    document.getElementById("participant-form");

const message =
    document.getElementById("message");

const pendingRegistration =
    document.getElementById(
        "pending-registration"
    );

const pendingEmail =
    document.getElementById(
        "pending-email"
    );

const resendConfirmationButton =
    document.getElementById(
        "resend-confirmation-button"
    );

const changeEmailButton =
    document.getElementById(
        "change-email-button"
    );

const changeEmailForm =
    document.getElementById(
        "change-email-form"
    );

const newEmailInput =
    document.getElementById(
        "new-email"
    );

const cancelEmailChangeButton =
    document.getElementById(
        "cancel-email-change-button"
    );


let exchange = null;


async function loadExchange() {

    let code = sharedCode;


    /*
    Keep the old homepage flow working too.
    */

    if (!code) {

        const storedExchange =
            localStorage.getItem("exchange");

        if (storedExchange) {

            const parsedExchange =
                JSON.parse(storedExchange);

            code =
                parsedExchange.code;
        }
    }


    if (!code) {

        window.location.href =
            "index.html";

        return;
    }


    try {

        const response = await fetch(
            `${API_BASE_URL}/api/exchanges/${encodeURIComponent(code)}`
        );


        if (!response.ok) {

            exchangeName.textContent =
                "Exchange not found";

            form.hidden =
                true;

            return;
        }


        exchange =
            await response.json();


        exchangeName.textContent =
            exchange.name;


        exchangeBudget.textContent =
            exchange.budget !== null
                ? `Budget: $${exchange.budget}`
                : "No budget specified";


        if (exchange.registration_closed) {

            message.textContent =
                "Registration for this exchange has closed.";

            form.hidden =
                true;

            return;
        }


        form.hidden =
            false;


    } catch (error) {

        console.error(error);

        message.textContent =
            "Could not connect to the server.";

        form.hidden =
            true;
    }
}


form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        if (!exchange) {
            return;
        }


        const participant = {
            name:
                document
                    .getElementById("name")
                    .value
                    .trim(),

            email:
                document
                    .getElementById("email")
                    .value
                    .trim(),

            interests:
                document
                    .getElementById("interests")
                    .value
                    .trim(),

            wishlist:
                document
                    .getElementById("wishlist")
                    .value
                    .trim()
        };


        const response = await fetch(
            `${API_BASE_URL}/api/participants/join/${encodeURIComponent(exchange.code)}`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(participant)
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            message.textContent =
                data.detail ||
                "Could not join exchange.";

            return;
        }


        sessionStorage.setItem(
            "participant_id",
            data.id
        );

        sessionStorage.setItem(
            "management_token",
            data.management_token
        );

        sessionStorage.setItem(
            "pending_email",
            data.email
        );


        form.hidden =
            true;

        message.textContent =
            "";

        pendingEmail.textContent =
            data.email;

        pendingRegistration.hidden =
            false;
    }
);

resendConfirmationButton.addEventListener(
    "click",
    async () => {

        const participantId =
            sessionStorage.getItem(
                "participant_id"
            );

        const managementToken =
            sessionStorage.getItem(
                "management_token"
            );


        if (!participantId || !managementToken) {

            message.textContent =
                "Registration information is no longer available. Please reopen your invitation.";

            return;
        }


        resendConfirmationButton.disabled =
            true;


        try {

            const response = await fetch(
                `${API_BASE_URL}/api/participants/${participantId}/resend-verification`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        management_token:
                            managementToken
                    })
                }
            );


            const data =
                await response.json();


            message.textContent =
                response.ok
                    ? "Confirmation email resent."
                    : (
                        data.detail ||
                        "Could not resend confirmation email."
                    );


        } catch (error) {

            console.error(error);

            message.textContent =
                "Could not connect to the server.";

        } finally {

            resendConfirmationButton.disabled =
                false;
        }
    }
);

changeEmailButton.addEventListener(
    "click",
    () => {

        const currentEmail =
            sessionStorage.getItem(
                "pending_email"
            );

        newEmailInput.value =
            currentEmail || "";

        changeEmailForm.hidden =
            false;

        newEmailInput.focus();
    }
);

cancelEmailChangeButton.addEventListener(
    "click",
    () => {

        changeEmailForm.hidden =
            true;
    }
);

changeEmailForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const participantId =
            sessionStorage.getItem(
                "participant_id"
            );

        const managementToken =
            sessionStorage.getItem(
                "management_token"
            );

        const newEmail =
            newEmailInput.value
                .trim();


        if (
            !participantId
            || !managementToken
        ) {

            message.textContent =
                "Registration information is no longer available. Please reopen your invitation.";

            return;
        }


        try {

            const response = await fetch(
                `${API_BASE_URL}/api/participants/${participantId}/email`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        management_token:
                            managementToken,

                        email:
                            newEmail
                    })
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                message.textContent =
                    data.detail ||
                    "Could not update email.";

                return;
            }

            sessionStorage.setItem(
                "pending_email",
                data.email
            );

            pendingEmail.textContent =
                data.email;

            message.textContent =
                data.message;

            changeEmailForm.hidden =
                true;


        } catch (error) {

            console.error(error);

            message.textContent =
                "Could not connect to the server.";
        }
    }
);

loadExchange();