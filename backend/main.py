from fastapi import FastAPI, File, UploadFile
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.efficientnet import preprocess_input
from PIL import Image
import numpy as np
import io
import uvicorn
from routes import router  # Import the router from routes.py


# Initialize FastAPI app
app = FastAPI()


from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow requests from anywhere (for testing)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routes for Authentication
app.include_router(router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, 
                ssl_keyfile="key.pem", ssl_certfile="cert.pem")


# Resolve the frontend directory
BASE_DIR = Path(__file__).resolve().parent  
FRONTEND_DIR = BASE_DIR.parent / "docs"  
BACKEND_DIR = BASE_DIR.parent/".backend"

# Mount static file directories
app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")
app.mount("/css", StaticFiles(directory=FRONTEND_DIR / "css"), name="css")
app.mount("/js", StaticFiles(directory=FRONTEND_DIR / "js"), name="js")
app.mount("/pages", StaticFiles(directory=FRONTEND_DIR / "pages"), name="pages")
app.mount("/static", StaticFiles(directory=FRONTEND_DIR / "static"), name="static")
# app.mount("/components", StaticFiles(directory=FRONTEND_DIR / "components"), name="components")

# Log registered routes on app startup
@app.on_event("startup")
async def show_routes():
    for route in app.routes:
        print(f"Registered route: {route.path}")







# Serve the main index.html
@app.get("/", response_class=HTMLResponse)
async def read_root():
    print("home page working")
    index_path = FRONTEND_DIR / "index.html"
    if index_path.exists():
        return HTMLResponse(content=index_path.read_text(), status_code=200)
    return HTMLResponse(content="Index file not found", status_code=404)


@app.get("/upload", response_class=HTMLResponse)
async def serve_upload_page():
    print("detect page working")
    upload_path = FRONTEND_DIR/"pages"/"upload.html"
    if upload_path.exists():
        return HTMLResponse(content=upload_path.read_text(), status_code=200)
    return HTMLResponse(content="Upload pAge not found", status_code=404)

@app.get("/guide", response_class=HTMLResponse)
async def serve_guide_page():
    print("detect page working")
    upload_path = FRONTEND_DIR/"pages"/"guide.html"
    if upload_path.exists():
        return HTMLResponse(content=upload_path.read_text(), status_code=200)
    return HTMLResponse(content="Upload pAge not found", status_code=404)


@app.get("/signIn", response_class=HTMLResponse)
async def signIn():
    try:
        upload_path = FRONTEND_DIR / "pages" / "signIn.html"
        print(f"Checking path: {upload_path}")  # Debugging output

        if upload_path.exists():
            return FileResponse(upload_path)  # Serve file directly
        else:
            print("File not found!")
            return HTMLResponse(content="Sign-in Page not found", status_code=404)
    except Exception as e:
        print(f"Error: {e}")
        return HTMLResponse(content=f"Internal Server Error: {str(e)}", status_code=500)
    
@app.get("/logIn", response_class=HTMLResponse)
async def logIn():
    try:
        upload_path = FRONTEND_DIR / "pages" / "login.html"
        print(f"Checking path: {upload_path}")  # Debugging output

        if upload_path.exists():
            return FileResponse(upload_path)  # Serve file directly
        else:
            print("File not found!")
            return HTMLResponse(content="Sign-in Page not found", status_code=404)
    except Exception as e:
        print(f"Error: {e}")
        return HTMLResponse(content=f"Internal Server Error: {str(e)}", status_code=500)




#--------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#ML PART___________________________________________________________________________________________________________________________________________________________

DISEASE_MODEL_PATH = r"R:\IIT\FYP\PROJECT\backend\model\final_model.keras"


try:
    disease_model = load_model(DISEASE_MODEL_PATH)
    print("MODEL LOADED SUCCESSFULLY")
except Exception as e:
    print(f"ERROR LOADING MODEL: {e}")

CLASS_LABLES_DISEASE = ['algal_spot',"brown_blight","gray_blight","healthy","helopeltis","red_spot"]



@app.post('/predict-disease')
async def predict_disease(file: UploadFile = File(...)):
    try:
        # Read image from the uploaded file
        content = await file.read()
        image = Image.open(io.BytesIO(content)).convert("RGB")  

        # Resize the image to match model input 
        image = image.resize((300, 300))

        # Convert image to numpy array and preprocess
        image_array = np.array(image)
        image_array = preprocess_input(image_array)  
        image_array = np.expand_dims(image_array, axis=0)  

        # Predict the class
        predictions = disease_model.predict(image_array)
        predicted_class_index = np.argmax(predictions, axis=1)[0]
        confidence = float(np.max(predictions))

        # Get the corresponding class label
        predicted_label = CLASS_LABLES_DISEASE[predicted_class_index]

        return JSONResponse(content={
            "class": predicted_label,
            "confidence": f"{confidence * 100:.2f}%"
        })

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)







RIPE_MODEL_PATH = r"R:\IIT\FYP\PROJECT\backend\model\Ripe_model.keras"

#  Load the model
try:
    ripe_model = load_model(RIPE_MODEL_PATH)
    print("✅ RIPE MODEL LOADED SUCCESSFULLY")
except Exception as e:
    print(f" ERROR LOADING RIPE MODEL: {e}")

#  Define class labels
CLASS_LABELS_RIPE = [" Ripe ", "Ripe", "Ripe", "Overripe"]

#  Define image preprocessing function
def preprocess_image(image_bytes):
    """Load, resize, and normalize the image for model prediction."""
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize((224, 224))  # Resize to match model input size
    image_array = np.array(image) / 255.0  # Normalize
    image_array = np.expand_dims(image_array, axis=0)  # Add batch dimension
    return image_array

#  Define API endpoint for ripeness prediction
@app.post('/predict-ripeness')
async def predict_ripe(file: UploadFile = File(...)):
    try:
        # Read image file
        image_bytes = await file.read()
        
        # Preprocess the image
        processed_image = preprocess_image(image_bytes)
        
        # Make a prediction
        predictions = ripe_model.predict(processed_image)
        predicted_index = np.argmax(predictions)
        confidence = np.max(predictions)

        # Get predicted label
        predicted_label = CLASS_LABELS_RIPE[predicted_index]

        # Return response
        return JSONResponse(content={
            "class": predicted_label,
            "confidence": f"{confidence * 100:.2f}%"
        })
    
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)