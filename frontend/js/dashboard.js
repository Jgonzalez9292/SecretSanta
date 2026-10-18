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

        const title =
            document.createElement("h3");

        title.textContent =
            exchange.name;


        const code =
            document.createElement("p");

        code.textContent =
            `Code: ${exchange.code}`;


        const budget =
            document.createElement("p");

        budget.textContent =
            `Budget: $${exchange.budget ?? "Not set"}`;


        const shareButton =
            document.createElement("button");

        shareButton.type =
            "button";

        shareButton.className =
            "share-button";

        shareButton.textContent =
            "Share";


        card.appendChild(title);
        card.appendChild(code);
        card.appendChild(budget);
        card.appendChild(shareButton);


        shareButton.addEventListener(
            "click",
            async (event) => {

                // Prevent the card click from opening
                // the management page
                event.stopPropagation();


                const inviteUrl =
                    new URL("./", window.location.href);

                inviteUrl.searchParams.set(
                    "code",
                    exchange.code
                );


                const shareData = {
                    title: `${exchange.name} Secret Santa`,
                    url: inviteUrl.toString()
                };


                try {

                    if (navigator.share) {

                        await navigator.share(
                            shareData
                        );

                    } else {

                        await navigator.clipboard.writeText(
                            inviteUrl.toString()
                        );

                        shareButton.textContent =
                            "Link copied!";

                        setTimeout(() => {
                            shareButton.textContent =
                                "Share";
                        }, 2000);
                    }

                } catch (error) {

                    // Ignore it if the user simply
                    // closes the share menu
                    if (error.name !== "AbortError") {
                        console.error(error);
                    }
                }
            }
        );


        card.addEventListener(
            "click",
            () => {
                window.location.href =
                    `exchange.html?id=${exchange.id}`;
            }
        );


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