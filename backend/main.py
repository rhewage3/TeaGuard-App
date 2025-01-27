from fastapi import FastAPI, File, UploadFile
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.efficientnet import preprocess_input
from PIL import Image
import numpy as np
import io

# Initialize FastAPI app
app = FastAPI()

# Resolve the frontend directory
BASE_DIR = Path(__file__).resolve().parent  
FRONTEND_DIR = BASE_DIR.parent / "frontend"  
BACKEND_DIR = BASE_DIR.parent/".backend"

# Mount static file directories
app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")
app.mount("/css", StaticFiles(directory=FRONTEND_DIR / "css"), name="css")
app.mount("/js", StaticFiles(directory=FRONTEND_DIR / "js"), name="js")
app.mount("/pages", StaticFiles(directory=FRONTEND_DIR / "pages"), name="pages")
app.mount("/static", StaticFiles(directory=FRONTEND_DIR / "static"), name="static")

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
        image = Image.open(io.BytesIO(content)).convert("RGB")  # Fixed variable name

        # Resize the image to match model input 
        image = image.resize((300, 300))

        # Convert image to numpy array and preprocess
        image_array = np.array(image)
        image_array = preprocess_input(image_array)  # Same preprocessing used in training
        image_array = np.expand_dims(image_array, axis=0)  # Add batch dimension

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




