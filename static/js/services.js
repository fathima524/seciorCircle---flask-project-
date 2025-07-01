document.addEventListener("DOMContentLoaded", function () {
    const categories = ["Healthcare", "Legal Assistance", "Transportation", "Home Services"];

    function renderCategories() {
        const container = document.getElementById("categoriesContainer");
        container.innerHTML = "";
        categories.forEach(category => {
            const card = document.createElement("div");
            card.className = "category-card";
            card.innerHTML = `<h3>${category}</h3>`;
            card.onclick = () => fetchServices(category);
            container.appendChild(card);
        });
    }

    function fetchServices(category, query = "") {
        fetch(`/api/services?category=${encodeURIComponent(category)}&search=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(data => {
                document.getElementById("servicesSection").style.display = "block";
                document.getElementById("categoryTitle").innerText = category;

                const container = document.getElementById("servicesContainer");
                container.innerHTML = "";

                if (data.services.length === 0) {
                    container.innerHTML = "<p>No services found.</p>";
                    return;
                }

                data.services.forEach(service => {
                    const card = document.createElement("div");
                    card.className = "service-card";
                    card.innerHTML = `
                        <h3>${service.name}</h3>
                        <p>${service.description}</p>
                        <p><strong>Contact:</strong> ${service.contact}</p>
                    `;
                    container.appendChild(card);
                });

                const form = document.getElementById("searchForm");
                form.onsubmit = function (e) {
                    e.preventDefault();
                    const search = document.getElementById("searchInput").value;
                    fetchServices(category, search);
                };
            });
    }

    renderCategories();
});

