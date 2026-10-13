const form =
    document.getElementById("signup-form");

const message =
    document.getElementById("message");


form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const user = {
        name: document
            .getElementById("name")
            .value
            .trim(),

        email: document
            .getElementById("email")
            .value
            .trim(),

        password: document
            .getElementById("password")
            .value
    };


    try {
        const response = await fetch(
            `${API_BASE_URL}/api/users/signup`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(user)
            }
        );


        if (!response.ok) {
            const error =
                await response.json();

            message.textContent =
                error.detail ||
                "Could not create account.";

            return;
        }


        message.textContent =
            "Account created. Logging you in...";


        const loginResponse = await fetch(
            `${API_BASE_URL}/api/users/login`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: user.email,
                    password: user.password
                })
            }
        );


        if (!loginResponse.ok) {
            message.textContent =
                "Account created. Please log in.";

            return;
        }


        const loginData =
            await loginResponse.json();


        localStorage.setItem(
            "access_token",
            loginData.access_token
        );


        window.location.href =
            "dashboard.html";


    } catch (error) {
        console.error(error);

        message.textContent =
            "Could not connect to the server.";
    }
});