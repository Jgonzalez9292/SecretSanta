const joinForm = document.getElementById("join-form");
const message = document.getElementById("message");

joinForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const code =
        document.getElementById("exchange-code").value.trim();

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/exchanges/${code}`
        );

        if (!response.ok) {
            message.textContent = "Exchange not found.";
            return;
        }

        const exchange = await response.json();

        if (exchange.registration_closed) {
            message.textContent =
                `Registration for ${exchange.name} has closed.`;

            return;
        }

        localStorage.setItem(
            "exchange",
            JSON.stringify(exchange)
        );

        window.location.href = "join.html";

    } catch (error) {
        console.error(error);

        message.textContent =
            "Could not connect to the server.";
    }
});