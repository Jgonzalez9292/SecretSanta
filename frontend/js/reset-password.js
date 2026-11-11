const form =
    document.getElementById(
        "reset-password-form"
    );

const message =
    document.getElementById(
        "message"
    );


const hash =
    window.location.hash.substring(1);

const params =
    new URLSearchParams(hash);

const resetToken =
    params.get("token");


if (!resetToken) {

    message.textContent =
        "This password reset link is invalid.";

    form.hidden =
        true;

} else {

    history.replaceState(
        null,
        "",
        window.location.pathname
    );
}


form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const password =
            document
                .getElementById("password")
                .value;

        const confirmPassword =
            document
                .getElementById(
                    "confirm-password"
                )
                .value;


        if (
            password !==
            confirmPassword
        ) {

            message.textContent =
                "Passwords do not match.";

            return;
        }


        if (
            password.length < 8
        ) {

            message.textContent =
                "Password must be at least 8 characters.";

            return;
        }


        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/api/users/reset-password`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                token:
                                    resetToken,

                                password:
                                    password
                            })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                message.textContent =
                    data.detail ||
                    "Could not reset password.";

                return;
            }


            message.textContent =
                data.message;

            form.hidden =
                true;


            setTimeout(
                () => {

                    window.location.href =
                        "login.html";

                },
                2000
            );


        } catch (error) {

            console.error(error);

            message.textContent =
                "Could not connect to the server.";
        }
    }
);