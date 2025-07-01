const programs = [
    {
      title: "Meals on Wheels",
      category: "food",
      location: "Downtown",
      description: "Free meal delivery for homebound seniors.",
      eligibility: "Ages 60+",
      contact: "555-1234"
    },
    {
      title: "Legal Aid Clinic",
      category: "legal",
      location: "Main Street",
      description: "Free legal consultation for seniors.",
      eligibility: "All seniors",
      contact: "555-5678"
    },
    {
      title: "Home Visit Nurse",
      category: "health",
      location: "Uptown",
      description: "Home health visits for seniors with chronic conditions.",
      eligibility: "Medical referral required",
      contact: "555-9012"
    }
  ];
  
  // Keep track of which programs are currently displayed
  let currentDisplayedPrograms = [];
  
  function applyFilters() {
    const category = document.getElementById("categoryFilter").value;
    const location = document.getElementById("locationFilter").value.trim().toLowerCase();
    const container = document.getElementById("programsContainer");
  
    container.innerHTML = "";
  
    const filtered = programs.filter(p => {
      const matchCategory = category === "all" || p.category === category;
      const matchLocation = location === "" || p.location.toLowerCase().includes(location);
      return matchCategory && matchLocation;
    });
  
    // Update our tracking array with the currently displayed programs
    currentDisplayedPrograms = filtered;
  
    if (filtered.length === 0) {
      container.innerHTML = "<p>No support programs found.</p>";
      return;
    }
  
    filtered.forEach((program, index) => {
      const card = document.createElement("div");
      card.className = "program-card";
      card.innerHTML = `
        <strong>${program.title}</strong><br/>
        ${program.location}<br/>
        <button onclick="openModal(${index})">View Details</button>
      `;
      container.appendChild(card);
    });
  }
  
  function openModal(index) {
    // Use the currentDisplayedPrograms array instead of the original programs array
    const program = currentDisplayedPrograms[index];
    document.getElementById("modalTitle").innerText = program.title;
    document.getElementById("modalDescription").innerText = program.description;
    document.getElementById("modalLocation").innerText = program.location;
    document.getElementById("modalEligibility").innerText = program.eligibility;
    document.getElementById("modalContact").innerText = program.contact;
    
    // Create and append modal overlay if it doesn't exist
    if (!document.querySelector('.modal-overlay')) {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', closeModal);
    }
    
    document.getElementById("modal").style.display = "block";
    document.querySelector('.modal-overlay').style.display = "block";
  }
  
  function closeModal() {
    document.getElementById("modal").style.display = "none";
    if (document.querySelector('.modal-overlay')) {
      document.querySelector('.modal-overlay').style.display = "none";
    }
  }
  
  document.getElementById("helpForm").addEventListener("submit", function (e) {
    e.preventDefault();
    alert("Your request has been submitted!");
    this.reset();
    closeModal();
  });
  
  // Close modal when Escape key is pressed
  document.addEventListener('keydown', function(e) {
    if (e.key === "Escape" && document.getElementById("modal").style.display === "block") {
      closeModal();
    }
  });
  
  // Show some programs by default when page loads
  window.onload = function() {
    // Add modal overlay for better UX
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.display = 'none';
    document.body.appendChild(overlay);
    
    applyFilters();
  };