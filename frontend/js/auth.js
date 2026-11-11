function logoutExpiredSession() {
    localStorage.removeItem("access_token");

    sessionStorage.setItem(
        "login_message",
        "Your session expired. Please log in again."
    );

    window.location.href =
        "login.html";
}


async function authenticatedFetch(
    url,
    options = {}
) {

    const token =
        localStorage.getItem(
            "access_token"
        );

    if (!token) {
        logoutExpiredSession();
        return;
    }


    const headers = {
        ...options.headers,
        "Authorization":
            `Bearer ${token}`
    };


    const response =
        await fetch(
            url,
            {
                ...options,
                headers
            }
        );


    if (response.status === 401) {
        logoutExpiredSession();
        return;
    }


    return response;
}