
document.addEventListener("DOMContentLoaded", () => {
    fetch('/api/user')
        .then(res => res.json())
        .then(data => {
            const authLinks = document.getElementById("auth-links");
            if (data.loggedIn) {
                authLinks.innerHTML = `<a href="/logout">Logout (${data.username})</a>`;
            } else {
                authLinks.innerHTML = '<a href="/login">Login</a> | <a href="/register">Sign Up</a>';
            }
        })
        .catch(err => {
            console.error("Error fetching user status:", err);
        });
});


