const token =
    localStorage.getItem("access_token");

if (!token) {
    window.location.href =
        "login.html";
}


const form =
    document.getElementById(
        "create-exchange-form"
    );

const message =
    document.getElementById(
        "message"
    );


form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const name =
            document
                .getElementById("name")
                .value
                .trim();

        const code =
            document
                .getElementById("code")
                .value
                .trim();

        const budgetValue =
            document
                .getElementById("budget")
                .value;

        const registrationDeadline =
            document
                .getElementById(
                    "registration-deadline"
                )
                .value;

        const drawDate =
            document
                .getElementById(
                    "draw-date"
                )
                .value;


        const exchange = {

            name:
                name,

            code:
                code,

            budget:
                budgetValue
                    ? Number(budgetValue)
                    : null,

            registration_deadline:
                registrationDeadline
                    ? new Date(
                        registrationDeadline
                    ).toISOString()
                    : null,

            draw_date:
                drawDate
                    ? new Date(
                        drawDate
                    ).toISOString()
                    : null
        };


        try {

            const response =
                await authenticatedFetch(
                    `${API_BASE_URL}/api/exchanges/`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                exchange
                            )
                    }
                );


            if (!response) {
                return;
            }


            if (!response.ok) {

                const error =
                    await response.json();

                console.error(
                    error
                );


                if (
                    typeof error.detail ===
                    "string"
                ) {

                    message.textContent =
                        error.detail;

                } else if (
                    Array.isArray(
                        error.detail
                    ) &&
                    error.detail.length > 0
                ) {

                    message.textContent =
                        error.detail[0]
                            .msg
                            .replace(
                                "Value error, ",
                                ""
                            );

                } else {

                    message.textContent =
                        "Could not create exchange.";
                }

                return;
            }


            window.location.href =
                "dashboard.html";


        } catch (error) {

            console.error(
                error
            );

            message.textContent =
                "Could not connect to the server.";
        }
    }
);