const form = document.getElementById("login-form");
const message = document.getElementById("message");


form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const credentials = {
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value
    };

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/users/login`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(credentials)
            }
        );

        if (!response.ok) {
            const error = await response.json();

            message.textContent =
                error.detail || "Login failed.";

            return;
        }

        const data = await response.json();

        localStorage.setItem(
            "access_token",
            data.access_token
        );

        window.location.href = "dashboard.html";

    } catch (error) {
        console.error(error);

        message.textContent =
            "Could not connect to the server.";
    }
});