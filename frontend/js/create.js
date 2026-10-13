const token =
    localStorage.getItem("access_token");

if (!token) {
    window.location.href = "login.html";
}

const form =
    document.getElementById("create-exchange-form");

const message =
    document.getElementById("message");

const success =
    document.getElementById("success");

const createdCode =
    document.getElementById("created-code");



form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name =
        document.getElementById("name").value.trim();

    const code =
        document.getElementById("code").value.trim();

    const budgetValue =
        document.getElementById("budget").value;

    const registrationDeadline =
        document.getElementById("registration-deadline").value;

    const drawDate =
        document.getElementById("draw-date").value;


    const exchange = {
        name: name,
        code: code,
        budget: budgetValue
            ? Number(budgetValue)
            : null,

        registration_deadline:
            registrationDeadline || null,

        draw_date:
            drawDate || null
    };


    try {
        const response = await fetch(
            "http://127.0.0.1:8000/api/exchanges/",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(exchange)
            }
        );

        if (!response.ok) {

            const error = await response.json();

            console.error(error);

            message.textContent =
                "Could not create exchange.";

            return;
        }

        if (!response.ok) {
            const error = await response.json();

            message.textContent =
                error.detail || "Could not create exchange.";

            return;
        }

        const createdExchange =
            await response.json();

        window.location.href = "dashboard.html";

    } catch (error) {

        console.error(error);

        message.textContent =
            "Could not connect to the server.";
    }
});