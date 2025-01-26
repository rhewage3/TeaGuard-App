
console.log("requests js working")

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
        })
        .catch(error => {
            console.error('Error loading the homepage:', error);
        });
}




function fetchDetectPage() {
    fetch('/upload')  // Corrected to match the FastAPI endpoint
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch the upload page.');
            }
            return response.text();
        })
        .then(html => {
            document.body.innerHTML = html;  // Load content into the body
        })
        .catch(error => {
            console.error('Error loading the upload page:', error);
        });
}

