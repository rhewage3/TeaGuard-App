


AOS.init();

function closeOffcanvas() {
    let offcanvasElement = document.querySelector('#top-navbar');
    let bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
    if (bsOffcanvas) {
        bsOffcanvas.hide();
    }
}

async function checkSession() {
  try {
      const response = await fetch("/session-info");
      const data = await response.json();

      if (data.logged_in) {
          updateNavbar(data.username);
      } else {
          updateNavbar(null);
      }
  } catch (error) {
      console.error("Error checking session:", error);
  }
}

//  Update Navbar Based on Session
async function updateNavbar() {
  console.log("Updating Navbar...");

  try {
      const response = await fetch("/session-info", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch session data");

      const data = await response.json();
      console.log("Session Data:", data);

      // Get elements
      const signInElement = document.getElementById("signin");
      const userNavElement = document.getElementById("user-nav");

      if (!signInElement || !userNavElement) {
          console.warn("Navbar elements not found. Skipping update.");
          return; // Exit if navbar elements don't exist
      }

      if (data.username) {
          console.log("User logged in, updating navbar...");

          // Replace Sign In button with username dropdown
          userNavElement.innerHTML = `
              <div class="dropdown">
                  <button class="btn btn-light dropdown-toggle" type="button" data-bs-toggle="dropdown">
                      ${data.username}
                  </button>
                  <ul class="dropdown-menu">
                      <li><a class="dropdown-item" href="dashboard.html">Dashboard</a></li>
                      <li><a class="dropdown-item" href="javascript:void(0)" onclick="logout()">Logout</a></li>
                  </ul>
              </div>
          `;
      } else {
          console.log("No user found, showing Sign In button");

          // Ensure Sign In button is displayed properly
          signInElement.innerHTML = "Sign In";
          signInElement.href = "javascript:void(0)";
          signInElement.onclick = () => fetchSignIn(); // Ensure it opens the login page
      }
  } catch (error) {
      console.error("Error fetching session info:", error);
  }
}

// Run `updateNavbar()` on every page load
document.addEventListener("DOMContentLoaded", updateNavbar);


//  Logout Function (Removes Session)
async function logout() {
  try {
      await fetch("/logout", { method: "POST" });
      checkSession(); // Refresh navbar
  } catch (error) {
      console.error("Logout error:", error);
  }
}

//  Run on Page Load
document.addEventListener("DOMContentLoaded", checkSession);



async function loginUser(event) {
  event.preventDefault();
  console.log("Login button clicked!");

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData
  });

  if (response.ok) {
      console.log("Login successful!");
      checkSession(); // Refresh navbar
      window.location.href = "/";
  } else {
      console.log("Login failed.");
      alert("Login failed. Please check your credentials.");
  }
}



async function SignInUser(event) {
  event.preventDefault(); // Prevent default form submission

  console.log("Sign-in button clicked! Function triggered.");

  // Get form values
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();

  // Validate password match
  if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
  }

  // Construct request payload
  const requestData = {
      username: username,
      email: email,
      password: password
  };

  try {
      // Send registration request
      const response = await fetch("/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData)
      });

      // Handle response
      if (response.ok) {
          const data = await response.json();
          console.log("Registration successful!", data);

          // Show success message & redirect to login page
          alert("Registration successful! Please log in.");
          fetchLogIn(); // Navigate to login page
      } else {
          const errorData = await response.json();
          console.error("Registration failed:", errorData);
          alert("Registration failed: " + errorData.detail);
      }
  } catch (error) {
      console.error("Error registering user:", error);
      alert("An unexpected error occurred. Please try again.");
  }
}




let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  // Show the install button
  document.getElementById("download-app-btn").style.display = "inline-block";
});

document.getElementById("download-app-btn").addEventListener("click", (e) => {
  // Check if the deferredPrompt is available
  if (deferredPrompt) {
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
      }
      // Clear the deferredPrompt variable, as it can only be used once
      deferredPrompt = null;
    });
  }
});






let detectionType = "";

function selectDetection(type) {
  const uploadArea = document.getElementById("upload-area");
  const uploadHeading = document.getElementById("upload-heading");
  const chooseFileButton = document.querySelector(".chooseFileButton");
  const imageInput = document.getElementById("imageUpload");
  const previewContainer = document.getElementById("image-preview");
  const scanButton = document.getElementById("scanButton");

  if (detectionType && detectionType !== type) {
    // Show SweetAlert confirmation
    Swal.fire({
        title: "Confirm Detection Type Change",
        text: "Switching the detection type will reset your uploaded image. Do you want to proceed?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#4CAF50",  
        cancelButtonColor: "#d9534f",   
        confirmButtonText: "Yes, Switch",
        cancelButtonText: "No, Keep It",
        background: "#f0f8e2",  
        color: "#333",  
        iconHtml: '<i class="bi bi-exclamation-circle"></i>',  
        buttonsStyling: false,  
        customClass: {
            popup: 'rounded-lg shadow-lg',
            confirmButton: 'btn btn-success btn-lg px-4',
            cancelButton: 'btn btn-danger btn-lg px-4',
            title: 'fw-bold fs-4',
            text: 'text-secondary'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Reset the uploaded image
            document.getElementById("imageUpload").value = ""; 
            document.getElementById("image-preview").innerHTML = "";
            document.getElementById("scanButton").style.display = "none";
            updateSelection(type);
        }
    });
    
  } else {
    updateSelection(type);
  }
}

function updateSelection(type) {
  detectionType = type;

  const uploadHeading = document.getElementById("upload-heading");
  uploadHeading.innerText =
    type === "disease"
      ? "Upload Image for Disease Detection"
      : "Upload Image for Ripeness Assessment";

  // Enable the upload area
  document.getElementById("upload-area").style.pointerEvents = "auto";
  document.getElementById("upload-area").style.opacity = "1";
  document.querySelector(".chooseFileButton").disabled = false;

  console.log(`Selected detection type: ${type}`);
}

function handleImage(input) {
    const file = input.files[0];
    const previewContainer = document.getElementById("image-preview");
    const scanButton = document.getElementById("scanButton");
    
    previewContainer.innerHTML = ""; // Clear previous preview
  
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.alt = "Uploaded Image";
        
        // Set a fixed size for better UI consistency
        img.style.maxWidth = "300px";
        img.style.maxHeight = "300px";
        img.style.borderRadius = "10px";
        img.style.objectFit = "cover";  // Ensures the image maintains aspect ratio without distortion
        img.classList.add("shadow-lg");
  
        // Add a fade-in effect for a smoother appearance
        img.style.opacity = "0";
        previewContainer.appendChild(img);
        setTimeout(() => {
          img.style.opacity = "1";
          img.style.transition = "opacity 0.3s ease-in-out";
        }, 50);
  
        // Show the scan button after image upload with an animation
        scanButton.style.display = "inline-block";
        scanButton.classList.add("animate__animated", "animate__fadeInUp"); // Animate CSS fade-in effect
      };
      reader.readAsDataURL(file);
    } else {
      // Hide scan button if no file is selected
      scanButton.style.display = "none";
    }
  }

// Disease name mapping with respective URLs for prevention guidance
// Mapping for disease names and ripeness levels
const resultMapping = {
  algal_spot: { name: "Algal Spot Disease", icon: "bi-exclamation-triangle-fill", color: "text-danger" },
  red_spot: { name: "Red Spot Disease", icon: "bi-exclamation-triangle-fill", color: "text-danger" },
  brown_blight: { name: "Brown Blight Disease", icon: "bi-exclamation-triangle-fill", color: "text-danger" },
  gray_blight: { name: "Gray Blight Disease", icon: "bi-exclamation-triangle-fill", color: "text-danger" },
  helopeltis: { name: "Helopeltis Disease", icon: "bi-exclamation-triangle-fill", color: "text-danger" },
  healthy: { name: "Healthy - No Disease", icon: "bi-emoji-smile-fill", color: "text-success" },
  
  // Ripeness results
  ripe: { name: "Ripe Tea Buds", icon: "bi-check-circle-fill", color: "text-success" },
  unripe: { name: "Unripe Tea Buds", icon: "bi-hourglass-split", color: "text-warning" },
  overripe: { name: "Overripe Tea Buds", icon: "bi-exclamation-triangle-fill", color: "text-danger" }
};

function scanImage() {
  const imageInput = document.getElementById("imageUpload");

  if (!imageInput.files.length) {
      Swal.fire({
          title: "No Image Selected",
          text: "Please upload an image before scanning.",
          icon: "error",
          confirmButtonColor: "#4CAF50"
      });
      return;
  }

  const formData = new FormData();
  formData.append("file", imageInput.files[0]);

  // Determine API endpoint based on detection type
  let apiEndpoint = detectionType === "disease" ? "/predict-disease" : "/predict-ripeness";

  // Show loading in result section
  const resultCard = document.getElementById("result-card");
  const resultContent = document.getElementById("result-content");

  resultCard.style.display = "block";
  resultContent.innerHTML = `<div class="col-12 text-center">
                                <div class="spinner-border text-success" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                                <p class="mt-2">Analyzing your image...</p>
                            </div>`;

  // Send the image to the backend for processing
  fetch(apiEndpoint, {
      method: "POST",
      body: formData
  })
  .then(response => response.json())
  .then(data => {
      let resultKey = data.class.toLowerCase();
      let resultInfo = resultMapping[resultKey] || { name: "Unknown Condition", icon: "bi-question-circle-fill", color: "text-muted" };

      // Show results dynamically with Bootstrap grid layout
      resultContent.innerHTML = `
          <div class="row align-items-center">
              <div class="col-md-4 text-center">
                  <i class="bi ${resultInfo.icon} ${resultInfo.color} display-1"></i>
              </div>
              <div class="col-md-8">
                  <h3 class="fw-bold ${resultInfo.color}">${resultInfo.name}</h3>
                  <p class="fs-5"><strong>Result:</strong> <span class="${resultInfo.color}">${resultInfo.name}</span></p>
                  <p class="fs-5"><strong>Confidence:</strong> <span class="text-info">${data.confidence}</span></p>
              </div>
          </div>
      `;

      // Hide "Learn More" button for ripeness assessment
      const learnMoreBtn = document.getElementById("learnMoreBtn");
      if (detectionType === "disease" && resultKey !== "healthy") {
          learnMoreBtn.style.display = "inline-block";
          learnMoreBtn.setAttribute("onclick", `fetchGuidePage()`);
      } else {
          learnMoreBtn.style.display = "none";
      }

      // Add animation to the result card
      resultCard.classList.add("animate__animated", "animate__fadeInUp");
  })
  .catch(error => {
      resultContent.innerHTML = `
          <div class="col-md-12 text-center">
              <i class="bi bi-exclamation-circle text-danger display-1"></i>
              <h5 class="mt-3 text-danger">Error Occurred</h5>
              <p class="text-muted">Something went wrong while scanning the image. Please try again.</p>
          </div>
      `;
      console.error("Error scanning the image:", error);
  });
}

// Function to clear results and allow new upload
function clearResults() {
    document.getElementById("imageUpload").value = "";
    document.getElementById("image-preview").innerHTML = "";
    document.getElementById("scanButton").style.display = "none";
    document.getElementById("result-card").style.display = "none";
}



async function loadDashboardData() {
    try {
        console.log("🔄 Fetching user predictions...");

        const response = await fetch("/user-predictions");
        if (!response.ok) throw new Error("Failed to fetch user predictions.");

        const data = await response.json();
        console.log("✅ API Response:", data);

        // Ensure the DOM is fully loaded before modifying elements
        setTimeout(() => {
            const totalPred = document.getElementById("total-predictions");
            const diseasePred = document.getElementById("disease-predictions");
            const ripenessPred = document.getElementById("ripeness-predictions");
            const historyTable = document.getElementById("historyTable");

            if (!totalPred || !diseasePred || !ripenessPred || !historyTable) {
                console.error("🚨 Missing elements in the DOM! Check your HTML IDs.");
                return;
            }

            // ✅ Update UI Elements
            totalPred.innerText = data.total;
            diseasePred.innerText = data.disease_count;
            ripenessPred.innerText = data.ripeness_count;

            console.log("🟢 Updated Counts:", data.total, data.disease_count, data.ripeness_count);

            // ✅ Update History Table
            historyTable.innerHTML = "";  // Clear old rows
            if (data.predictions.length > 0) {
                data.predictions.forEach(prediction => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${prediction.type.charAt(0).toUpperCase() + prediction.type.slice(1)}</td>
                        <td>${prediction.result}</td>
                        <td>${prediction.confidence}</td>
                        <td>${prediction.date}</td>
                    `;
                    historyTable.appendChild(row);
                });
                console.log("🟢 Updated History Table");
            } else {
                historyTable.innerHTML = `<tr><td colspan="4" class="text-center">No history found.</td></tr>`;
            }

            // ✅ Generate Charts (ONLY ONCE)
            if (!window.chartsInitialized) {
                generateCharts(data.disease_distribution, data.ripeness_distribution);
                window.chartsInitialized = true; // Prevent multiple chart creations
            }

        }, 500);

    } catch (error) {
        console.error("🚨 Error in Dashboard Data:", error);
    }
}

// ✅ Call function when the page is fully loaded
document.addEventListener("DOMContentLoaded", loadDashboardData);

function generateCharts(diseaseData, ripenessData) {
    console.log("📊 Generating Charts - Disease:", diseaseData, "Ripeness:", ripenessData);

    const diseaseCanvas = document.getElementById("diseaseChart");
    const ripenessCanvas = document.getElementById("ripenessChart");

    if (!diseaseCanvas || !ripenessCanvas) {
        console.error("🚨 Chart.js Canvas Elements Not Found!");
        return;
    }

    // ✅ Prevent Infinite Loop: Destroy Previous Chart Instances
    if (window.diseaseChartInstance) {
        window.diseaseChartInstance.destroy();
        console.log("🔄 Destroyed Previous Disease Chart");
    }
    if (window.ripenessChartInstance) {
        window.ripenessChartInstance.destroy();
        console.log("🔄 Destroyed Previous Ripeness Chart");
    }

    // ✅ Fix Chart Canvas Height & Width to Prevent Infinite Growth
    diseaseCanvas.style.width = "100%";
    diseaseCanvas.style.height = "300px";  
    ripenessCanvas.style.width = "100%";
    ripenessCanvas.style.height = "300px"; 

    // ✅ Create Disease Chart (No Duplicates)
    window.diseaseChartInstance = new Chart(diseaseCanvas.getContext("2d"), {
        type: "pie",
        data: {
            labels: Object.keys(diseaseData),
            datasets: [{
                data: Object.values(diseaseData),
                backgroundColor: ["#ff5733", "#33c4ff", "#ffcc33", "#00cc99", "#9933ff", "#ff3399"]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // ✅ Create Ripeness Chart (No Duplicates)
    window.ripenessChartInstance = new Chart(ripenessCanvas.getContext("2d"), {
        type: "pie",
        data: {
            labels: Object.keys(ripenessData),
            datasets: [{
                data: Object.values(ripenessData),
                backgroundColor: ["#33c4ff", "#ff5733"]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    console.log("✅ Charts Rendered Successfully Without Duplication");
}
