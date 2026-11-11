const form =
    document.getElementById(
        "forgot-password-form"
    );

const message =
    document.getElementById(
        "message"
    );


form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const email =
            document
                .getElementById("email")
                .value
                .trim();


        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/api/users/forgot-password`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                email: email
                            })
                    }
                );


            if (!response.ok) {

                message.textContent =
                    "Could not send reset link.";

                return;
            }


            const data =
                await response.json();


            message.textContent =
                data.message;


            form.reset();


        } catch (error) {

            console.error(error);

            message.textContent =
                "Could not connect to the server.";
        }
    }
);