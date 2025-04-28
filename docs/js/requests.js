
console.log("requests js working")


function fetchSignIn() {
    fetch('/signIn')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch the sign-in page.');
            }
            return response.text();
        })
        .then(html => {
            document.body.innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading the sign-in page:', error);
        });
}



function fetchLogIn() {
    fetch('/logIn')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch the log-in page.');
            }
            return response.text();
        })
        .then(html => {
            document.body.innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading the log-in page:', error);
        });
}




function loadHomePage() {
    fetch('/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load the homepage.');
            }
            return response.text();
        })
        .then(html => {
            document.body.innerHTML = html;  // Replace the body content with the homepage
            updateNavbar();
        })
        .catch(error => {
            console.error('Error loading the homepage:', error);
        });
}




function fetchDetectPage() {
    fetch('/upload')  
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch the upload page.');
            }
            return response.text();
        })
        .then(html => {
            document.body.innerHTML = html;  // Load content into the body
            updateNavbar();
        })
        .catch(error => {
            console.error('Error loading the upload page:', error);
        });
}

function fetchDashbordPage() {
    fetch('/dashboard')  
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch the dashboard page.');
            }
            return response.text();
        })
        .then(html => {
            document.body.innerHTML = html;  // Load content into the body
            console.log("🟢 Dashboard page loaded, now running loadDashboardData...");
            updateNavbar();
            
            // Delay execution slightly to ensure DOM is fully loaded
            setTimeout(() => {
                loadDashboardData();
            }, 500); 
        })
        .catch(error => {
            console.error('Error loading the dashboard page:', error);
        });
}


// Function to fetch the guide page dynamically when "Learn More" is clicked
function fetchGuidePage(url) {
    fetch("/guide")
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch the guide page.");
            }
            return response.text();
        })
        .then(html => {
            document.body.innerHTML = html;  // Load guide page content

            updateNavbar();

            // Scroll to the relevant section based on disease anchor
            if (url && url !== "#") {
                setTimeout(() => {
                    const section = document.querySelector(url);
                    if (section) {
                        section.scrollIntoView({ behavior: "smooth" });
                    }
                }, 500);
            }
        })
        .catch(error => {
            console.error("Error loading the guide page:", error);
            Swal.fire({
                title: "Error",
                text: "Failed to load the guide page. Please try again.",
                icon: "error",
                confirmButtonColor: "#4CAF50"
            });
        });
}


