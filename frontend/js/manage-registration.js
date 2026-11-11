const hashParams =
    new URLSearchParams(
        window.location.hash.substring(1)
    );


const hashToken =
    hashParams.get("token");


if (hashToken) {

    sessionStorage.setItem(
        "secret_santa_management_token",
        hashToken
    );

    history.replaceState(
        null,
        "",
        window.location.pathname
    );
}


const managementToken =
    sessionStorage.getItem(
        "secret_santa_management_token"
    );


const exchangeName =
    document.getElementById(
        "manage-exchange-name"
    );

const status =
    document.getElementById(
        "manage-status"
    );

const content =
    document.getElementById(
        "manage-registration-content"
    );

const participantName =
    document.getElementById(
        "manage-name"
    );

const participantEmail =
    document.getElementById(
        "manage-email"
    );

const deadline =
    document.getElementById(
        "manage-deadline"
    );

const interests =
    document.getElementById(
        "manage-interests"
    );

const wishlist =
    document.getElementById(
        "manage-wishlist"
    );

const form =
    document.getElementById(
        "manage-registration-form"
    );

const saveButton =
    document.getElementById(
        "save-registration-button"
    );

const withdrawButton =
    document.getElementById(
        "withdraw-button"
    );

const message =
    document.getElementById(
        "manage-message"
    );


let registrationClosed = false;


async function loadRegistration() {

    if (!managementToken) {

        exchangeName.textContent =
            "Invalid management link";

        message.textContent =
            "This registration link is missing or invalid.";

        return;
    }


    try {

        const response = await fetch(
            `${API_BASE_URL}/api/participants/manage`,
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


        if (!response.ok) {

            exchangeName.textContent =
                "Registration not found";

            message.textContent =
                data.detail ||
                "Could not load your registration.";

            return;
        }


        exchangeName.textContent =
            data.exchange.name;


        participantName.textContent =
            data.participant.name;


        participantEmail.textContent =
            data.participant.email;


        deadline.textContent =
            data.exchange.registration_deadline
                ? new Date(
                    data.exchange.registration_deadline
                ).toLocaleDateString(
                    "en-US",
                    {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                    }
                )
                : "Not specified";


        interests.value =
            data.participant.interests || "";


        wishlist.value =
            data.participant.wishlist || "";


        registrationClosed =
            data.registration_closed;


        if (registrationClosed) {

            status.textContent =
                "Registration has closed. Your information is now locked.";

            interests.disabled =
                true;

            wishlist.disabled =
                true;

            saveButton.disabled =
                true;

            withdrawButton.disabled =
                true;

        } else if (
            data.participant.email_verified_at
        ) {

            status.textContent =
                "✓ Your registration is confirmed.";

        } else {

            status.textContent =
                "Your email is still awaiting confirmation.";
        }


        content.hidden =
            false;


    } catch (error) {

        console.error(error);

        exchangeName.textContent =
            "Something went wrong";

        message.textContent =
            "Could not connect to the server.";
    }
}


form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        if (
            !managementToken
            || registrationClosed
        ) {
            return;
        }


        message.textContent =
            "";


        try {

            const response = await fetch(
                `${API_BASE_URL}/api/participants/manage`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        management_token:
                            managementToken,

                        interests:
                            interests.value.trim(),

                        wishlist:
                            wishlist.value.trim()
                    })
                }
            );


            const data =
                await response.json();


            message.textContent =
                response.ok
                    ? data.message
                    : (
                        data.detail ||
                        "Could not save your changes."
                    );


        } catch (error) {

            console.error(error);

            message.textContent =
                "Could not connect to the server.";
        }
    }
);


withdrawButton.addEventListener(
    "click",
    async () => {

        if (
            !managementToken
            || registrationClosed
        ) {
            return;
        }


        const confirmed =
            window.confirm(
                "Are you sure you want to withdraw from this Secret Santa exchange? This cannot be undone."
            );


        if (!confirmed) {
            return;
        }


        try {

            const response = await fetch(
                `${API_BASE_URL}/api/participants/manage/withdraw`,
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


            if (!response.ok) {

                message.textContent =
                    data.detail ||
                    "Could not withdraw from the exchange.";

                return;
            }


            sessionStorage.removeItem(
                "secret_santa_management_token"
            );


            content.hidden =
                true;


            status.textContent =
                "";


            exchangeName.textContent =
                "You have withdrawn";


            message.textContent =
                data.message;


        } catch (error) {

            console.error(error);

            message.textContent =
                "Could not connect to the server.";
        }
    }
);


loadRegistration();