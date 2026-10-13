const joinForm = document.getElementById("join-form");
const message = document.getElementById("message");

joinForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const code =
        document.getElementById("exchange-code").value.trim();

    try {
        const response = await fetch(
            `http://127.0.0.1:8000/api/exchanges/${code}`
        );

        if (!response.ok) {
            message.textContent = "Exchange not found.";
            return;
        }

        const exchange = await response.json();

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