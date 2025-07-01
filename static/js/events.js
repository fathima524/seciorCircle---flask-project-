document.addEventListener("DOMContentLoaded", () => {
  const eventsContainer = document.getElementById("eventsContainer");
  const pendingEvents = document.getElementById("pendingEvents");
  const volunteerList = document.getElementById("volunteerList");
  const reviewsContainer = document.getElementById("reviewsContainer");

  // Fetch and display events from DB
  async function fetchEvents(category = "", location = "") {
    let url = `/api/events?category=${category}&location=${location}`;
    const res = await fetch(url);
    const events = await res.json();
    displayEvents(events);
  }

  function displayEvents(eventList) {
    eventsContainer.innerHTML = "";
    if (eventList.length === 0) {
      eventsContainer.innerHTML = "<p>No events found matching your filters.</p>";
      return;
    }
    eventList.forEach(event => {
      const div = document.createElement("div");
      div.className = "event-card category-" + event.category;
      div.innerHTML = `
        <h3>${event.title}</h3>
        <p><strong>Date:</strong> ${new Date(event.date).toLocaleString()}</p>
        <p><strong>Location:</strong> ${event.location}</p>
        <p>${event.desc}</p>
        <button onclick="openRSVPModal('${event.title.replace(/'/g, "\\'")}')">RSVP</button>
      `;
      eventsContainer.appendChild(div);
    });
  }

  // Filter Events
  document.getElementById("filterForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const category = document.getElementById("category").value.toLowerCase();
    const location = document.getElementById("location").value.toLowerCase();
    fetchEvents(category, location);
  });

  // Suggest New Event
  document.getElementById("suggestForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
      title: document.getElementById("eventTitle").value,
      desc: document.getElementById("eventDesc").value,
      date: document.getElementById("eventDateTime").value,
      location: document.getElementById("eventLocation").value,
      category: document.getElementById("eventCategory").value
    };

    const res = await fetch("/api/events/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      alert("Event suggestion submitted!");
      document.getElementById("suggestForm").reset();
      fetchPending(); // refresh pending list
    } else {
      alert("Failed to submit event.");
    }
  });

  // Fetch pending suggestions
  async function fetchPending() {
    const res = await fetch("/api/events/pending");
    const pending = await res.json();
    displayPending(pending);
  }

  function displayPending(pending) {
    pendingEvents.innerHTML = "";
    pending.forEach(event => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${event.title}</span>
        <div>
          <button class="btn-approve" onclick="approveEvent('${event._id}')">Approve</button>
          <button class="btn-reject" onclick="rejectEvent('${event._id}')">Reject</button>
        </div>
      `;
      pendingEvents.appendChild(li);
    });
  }

  window.approveEvent = async function(id) {
    await updateStatus(id, "approved");
    fetchPending();
    fetchEvents(); // refresh approved list
  };

  window.rejectEvent = async function(id) {
    await updateStatus(id, "rejected");
    fetchPending();
  };

  async function updateStatus(id, status) {
    await fetch(`/api/events/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
  }

  // Static section - Volunteers and Reviews (for now)
  const volunteers = [
    "Setup help for Art & Craft Afternoon", 
    "Tech assistance for workshop", 
    "Greeter at Yoga for Seniors"
  ];

  const reviews = [
    { text: "Loved the yoga session!", rating: "5" },
    { text: "Craft day was so fun and relaxing.", rating: "4" }
  ];

  function displayVolunteers() {
    volunteerList.innerHTML = "";
    volunteers.forEach(task => {
      const li = document.createElement("li");
      li.innerHTML = `${task} <button onclick="alert('Signed up!')">Sign Up</button>`;
      volunteerList.appendChild(li);
    });
  }

  function displayReviews() {
    reviewsContainer.innerHTML = "";
    reviews.forEach(review => {
      const div = document.createElement("div");
      div.className = "review-card";
      div.innerHTML = `
        <p>"${review.text}"</p>
        <p><strong>Rating:</strong> ${review.rating}/5</p>
      `;
      reviewsContainer.appendChild(div);
    });
  }

  document.getElementById("reviewForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = document.getElementById("reviewText").value;
    const rating = document.getElementById("reviewRating").value;
    if (text.trim() && rating) {
      reviews.push({ text, rating });
      displayReviews();
      document.getElementById("reviewText").value = "";
      document.getElementById("reviewRating").value = "5";
    }
  });

  // RSVP Modal Functions
  window.openRSVPModal = function(eventTitle) {
    document.getElementById("rsvpEventTitle").value = eventTitle;
    document.getElementById("rsvpModal").style.display = "flex";
  };

  window.closeRSVPModal = function() {
    document.getElementById("rsvpModal").style.display = "none";
  };

  // RSVP Form Submission
  document.getElementById("rsvpForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const email = document.getElementById("rsvpEmail").value;
    const title = document.getElementById("rsvpEventTitle").value;

    fetch("/send_rsvp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email: email, title: title })
    })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      closeRSVPModal();
    })
    .catch(err => {
      console.error("RSVP error:", err);
      alert("Failed to send RSVP. Please try again.");
    });
  });

  // Initial loads
  fetchEvents();
  fetchPending();
  displayVolunteers();
  displayReviews();
});