AOS.init();



function closeOffcanvas() {
    let offcanvasElement = document.querySelector('#top-navbar');
    let bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
    if (bsOffcanvas) {
        bsOffcanvas.hide();
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
const diseaseMapping = {
    red_spot: { name: "Red Spot Disease", url: "#" },
    brown_blight: { name: "Brown Blight Disease", url: "#" },
    gray_blight: { name: "Gray Blight Disease", url: "#" },
    healthy: { name: "Healthy - No Disease", url: "#" },
    helopeltis: { name: "Helopeltis Disease", url: "#" },
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
        let diseaseInfo = diseaseMapping[resultKey] || { name: "Unknown Condition", url: "#" };

        // Determine icon and color based on result
        let resultIcon, resultTextColor;
        
        if (resultKey === "healthy") {
            resultIcon = '<i class="bi bi-emoji-smile-fill text-success display-1"></i>';
            resultTextColor = "text-success";
        } else {
            resultIcon = '<i class="bi bi-exclamation-triangle-fill text-danger display-1"></i>';
            resultTextColor = "text-danger";
        }

        // Show results dynamically with Bootstrap grid layout
        resultContent.innerHTML = `
            <div class="row align-items-center">
                <div class="col-md-4 text-center">
                    ${resultIcon}
                </div>
                <div class="col-md-8">
                    <h3 class="fw-bold ${resultTextColor}">${diseaseInfo.name}</h3>
                    <p class="fs-5"><strong>Result:</strong> <span class="${resultTextColor}">${diseaseInfo.name}</span></p>
                    <p class="fs-5"><strong>Confidence:</strong> <span class="text-info">${data.confidence}</span></p>
                </div>
            </div>
        `;

        // Show the "Learn More" button only if not healthy
        const learnMoreBtn = document.getElementById("learnMoreBtn");
        if (resultKey !== "healthy") {
            learnMoreBtn.style.display = "inline-block";
            learnMoreBtn.setAttribute("onclick", `fetchGuidePage('${diseaseInfo.url}')`);
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
