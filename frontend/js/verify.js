const params =
    new URLSearchParams(
        window.location.hash.substring(1)
    );

const token =
    params.get("token");

const title =
    document.getElementById(
        "verification-title"
    );

const message =
    document.getElementById(
        "verification-message"
    );

const confirmButton =
    document.getElementById(
        "confirm-registration-button"
    );

const homeLink =
    document.getElementById(
        "home-link"
    );


if (!token) {

    title.textContent =
        "Invalid confirmation link";

    message.textContent =
        "This confirmation link is missing its verification token.";

    confirmButton.hidden =
        true;

    homeLink.hidden =
        false;

} else {

    title.textContent =
        "Confirm your registration";

    message.textContent =
        "Click Confirm Registration to verify your email and join the Secret Santa draw.";

    confirmButton.hidden =
        false;
}


confirmButton.addEventListener(
    "click",
    async () => {

        confirmButton.disabled =
            true;

        confirmButton.textContent =
            "Confirming...";


        try {

            const response = await fetch(
                `${API_BASE_URL}/api/participants/verify`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        token: token
                    })
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                title.textContent =
                    "Could not confirm registration";

                message.textContent =
                    data.detail ||
                    "This confirmation link is invalid or has expired.";

                confirmButton.hidden =
                    true;

                homeLink.hidden =
                    false;

                return;
            }


            title.textContent =
                "You're confirmed! 🎄";

            message.textContent =
                "Your Secret Santa registration is complete. Keep an eye on your email for your assignment after the draw.";

            confirmButton.hidden =
                true;

            homeLink.hidden =
                false;


        } catch (error) {

            console.error(error);

            title.textContent =
                "Something went wrong";

            message.textContent =
                "We could not connect to the server. Please try again.";

            confirmButton.disabled =
                false;

            confirmButton.textContent =
                "Confirm Registration";
        }
    }
);