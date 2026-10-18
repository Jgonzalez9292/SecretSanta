const exchange =
    JSON.parse(localStorage.getItem("exchange"));

const exchangeName =
    document.getElementById("exchange-name");

const exchangeBudget =
    document.getElementById("exchange-budget");

const form =
    document.getElementById("participant-form");

const message =
    document.getElementById("message");


if (!exchange) {
    window.location.href = "index.html";
}


exchangeName.textContent = exchange.name;

exchangeBudget.textContent =
    `Budget: $${exchange.budget}`;


form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const participant = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        interests: document.getElementById("interests").value.trim(),
        wishlist: document.getElementById("wishlist").value.trim()
    };

    const response = await fetch(
        `${API_BASE_URL}/api/participants/join/${exchange.code}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(participant)
        }
    );

    if (!response.ok) {

        const error =
            await response.json();

        message.textContent =
            error.detail ||
            "Could not join exchange.";

        return;
    }

    message.textContent =
        "You're in! Your Secret Santa assignment will be emailed later.";

    form.reset();
});