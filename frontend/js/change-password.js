const token =
    localStorage.getItem(
        "access_token"
    );

if (!token) {
    window.location.href =
        "login.html";
}


const form =
    document.getElementById(
        "change-password-form"
    );

const message =
    document.getElementById(
        "message"
    );


form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const currentPassword =
            document
                .getElementById(
                    "current-password"
                )
                .value;

        const newPassword =
            document
                .getElementById(
                    "new-password"
                )
                .value;

        const confirmPassword =
            document
                .getElementById(
                    "confirm-password"
                )
                .value;


        if (
            newPassword !==
            confirmPassword
        ) {

            message.textContent =
                "New passwords do not match.";

            return;
        }


        if (
            newPassword.length < 8
        ) {

            message.textContent =
                "New password must be at least 8 characters.";

            return;
        }


        const response =
            await authenticatedFetch(
                `${API_BASE_URL}/api/users/change-password`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            current_password:
                                currentPassword,

                            new_password:
                                newPassword
                        })
                }
            );


        if (!response) {
            return;
        }


        const data =
            await response.json();


        if (!response.ok) {

            message.textContent =
                data.detail ||
                "Could not change password.";

            return;
        }


        message.textContent =
            data.message;

        form.reset();
    }
);