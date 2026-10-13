const token =
    localStorage.getItem("access_token");

const welcome =
    document.getElementById("welcome");

const exchangeList =
    document.getElementById("exchange-list");

const logoutButton =
    document.getElementById("logout-button");


if (!token) {
    window.location.href = "login.html";
}


async function loadDashboard() {

    const userResponse = await fetch(
        `${API_BASE_URL}/api/users/me`,
        {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        }
    );

    if (!userResponse.ok) {
        localStorage.removeItem("access_token");
        window.location.href = "login.html";
        return;
    }

    const user = await userResponse.json();

    welcome.textContent =
        `Welcome, ${user.name}`;


    const exchangeResponse = await fetch(
        `${API_BASE_URL}/api/exchanges/mine`,
        {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        }
    );

    if (!exchangeResponse.ok) {
        exchangeList.textContent =
            "Could not load exchanges.";

        return;
    }

    const exchanges =
        await exchangeResponse.json();


    if (exchanges.length === 0) {
        exchangeList.textContent =
            "You haven't created any exchanges yet.";

        return;
    }


    exchanges.forEach(exchange => {

        const card =
            document.createElement("div");

        card.innerHTML = `
            <h3>${exchange.name}</h3>

            <p>
                Code: ${exchange.code}
            </p>

            <p>
                Budget:
                $${exchange.budget ?? "Not set"}
            </p>
        `;

        card.addEventListener("click", () => {
            window.location.href =
                `exchange.html?id=${exchange.id}`;
        });

        exchangeList.appendChild(card);
    });
}


logoutButton.addEventListener(
    "click",
    () => {
        localStorage.removeItem("access_token");
        window.location.href = "login.html";
    }
);


loadDashboard();