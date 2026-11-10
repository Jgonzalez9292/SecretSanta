const params =
    new URLSearchParams(
        window.location.search
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

const homeLink =
    document.getElementById(
        "home-link"
    );


async function verifyRegistration() {

    if (!token) {

        title.textContent =
            "Invalid confirmation link";

        message.textContent =
            "This confirmation link is missing its verification token.";

        homeLink.hidden =
            false;

        return;
    }


    try {

        const response = await fetch(
            `${API_BASE_URL}/api/participants/verify?token=${encodeURIComponent(token)}`,
            {
                method: "POST"
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

            homeLink.hidden =
                false;

            return;
        }


        title.textContent =
            "You're confirmed! 🎄";

        message.textContent =
            "Your Secret Santa registration is complete. Keep an eye on your email for your assignment after the draw.";

        homeLink.hidden =
            false;


    } catch (error) {

        console.error(error);

        title.textContent =
            "Something went wrong";

        message.textContent =
            "We could not connect to the server. Please try the confirmation link again.";

        homeLink.hidden =
            false;
    }
}


verifyRegistration();