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

        card.className =
            "exchange-card";


        const topRow =
            document.createElement("div");

        topRow.className =
            "exchange-card-top";


        const titleArea =
            document.createElement("div");


        const title =
            document.createElement("h3");

        const titleLink =
            document.createElement("a");

        titleLink.href =
            `exchange.html?id=${exchange.id}`;

        titleLink.className =
            "exchange-title-link";

        titleLink.textContent =
            exchange.name;

        title.appendChild(
            titleLink
        );


        const code =
            document.createElement("span");

        code.className =
            "exchange-code-badge";

        code.textContent =
            exchange.code;


        titleArea.appendChild(
            title
        );

        titleArea.appendChild(
            code
        );


        const shareButton =
            document.createElement("button");

        shareButton.type =
            "button";

        shareButton.className =
            "share-button";

        shareButton.textContent =
            "Share Invite";


        topRow.appendChild(
            titleArea
        );

        topRow.appendChild(
            shareButton
        );


        const details =
            document.createElement("div");

        details.className =
            "exchange-card-details";


        const budget =
            document.createElement("div");

        budget.className =
            "exchange-card-detail";


        const budgetLabel =
            document.createElement("span");

        budgetLabel.textContent =
            "Gift Limit";


        const budgetValue =
            document.createElement("strong");

        budgetValue.textContent =
            exchange.budget !== null
                ? `$${Number(exchange.budget).toFixed(0)}`
                : "Not set";


        budget.appendChild(
            budgetLabel
        );

        budget.appendChild(
            budgetValue
        );


        const manage =
            document.createElement("div");

        manage.className =
            "exchange-card-detail";


        const manageLabel =
            document.createElement("span");

        manageLabel.textContent =
            "Organizer";


        const manageValue =
            document.createElement("strong");

        manageValue.textContent =
            "Manage Exchange";


        manage.appendChild(
            manageLabel
        );

        manage.appendChild(
            manageValue
        );


        details.appendChild(
            budget
        );

        details.appendChild(
            manage
        );


        card.appendChild(
            topRow
        );

        card.appendChild(
            details
        );


        shareButton.addEventListener(
            "click",
            async (event) => {

                event.stopPropagation();


                const inviteUrl =
                    new URL(
                        "join.html",
                        window.location.href
                    );

                inviteUrl.searchParams.set(
                    "code",
                    exchange.code
                );


                const shareData = {
                    title:
                        `${exchange.name} Secret Santa`,

                    url:
                        inviteUrl.toString()
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

                        setTimeout(
                            () => {

                                shareButton.textContent =
                                    "Share Invite";

                            },
                            2000
                        );
                    }

                } catch (error) {

                    if (
                        error.name !==
                        "AbortError"
                    ) {

                        console.error(
                            error
                        );
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


        exchangeList.appendChild(
            card
        );
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