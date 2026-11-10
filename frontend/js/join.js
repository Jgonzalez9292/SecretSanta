const params =
    new URLSearchParams(window.location.search);

const sharedCode =
    params.get("code");


const exchangeName =
    document.getElementById("exchange-name");

const exchangeBudget =
    document.getElementById("exchange-budget");

const form =
    document.getElementById("participant-form");

const message =
    document.getElementById("message");


let exchange = null;


async function loadExchange() {

    let code = sharedCode;


    /*
    Keep the old homepage flow working too.
    */

    if (!code) {

        const storedExchange =
            localStorage.getItem("exchange");

        if (storedExchange) {

            const parsedExchange =
                JSON.parse(storedExchange);

            code =
                parsedExchange.code;
        }
    }


    if (!code) {

        window.location.href =
            "index.html";

        return;
    }


    try {

        const response = await fetch(
            `${API_BASE_URL}/api/exchanges/${encodeURIComponent(code)}`
        );


        if (!response.ok) {

            exchangeName.textContent =
                "Exchange not found";

            form.hidden =
                true;

            return;
        }


        exchange =
            await response.json();


        exchangeName.textContent =
            exchange.name;


        exchangeBudget.textContent =
            exchange.budget !== null
                ? `Budget: $${exchange.budget}`
                : "No budget specified";


        if (exchange.registration_closed) {

            message.textContent =
                "Registration for this exchange has closed.";

            form.hidden =
                true;

            return;
        }


        form.hidden =
            false;


    } catch (error) {

        console.error(error);

        message.textContent =
            "Could not connect to the server.";

        form.hidden =
            true;
    }
}


form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        if (!exchange) {
            return;
        }


        const participant = {
            name:
                document
                    .getElementById("name")
                    .value
                    .trim(),

            email:
                document
                    .getElementById("email")
                    .value
                    .trim(),

            interests:
                document
                    .getElementById("interests")
                    .value
                    .trim(),

            wishlist:
                document
                    .getElementById("wishlist")
                    .value
                    .trim()
        };


        const response = await fetch(
            `${API_BASE_URL}/api/participants/join/${encodeURIComponent(exchange.code)}`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(participant)
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            message.textContent =
                data.detail ||
                "Could not join exchange.";

            return;
        }


        message.textContent =
            "Registration submitted. Check your email for confirmation.";

        form.reset();
    }
);


loadExchange();