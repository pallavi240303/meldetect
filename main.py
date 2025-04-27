from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from PIL import Image
import numpy as np
import skin_cancer_detection as SCD
import io
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/predict")
async def predict(request: Request):
    image_data = await request.body()
    input_image = Image.open(io.BytesIO(image_data)).resize((28, 28))
    img_array = np.array(input_image).reshape(-1, 28, 28, 3)

    prediction = SCD.model.predict(img_array)
    predicted_class_index = np.argmax(prediction, axis=1)[0]
    predicted_class = SCD.classes[predicted_class_index]

    response = {
        "predicted_class": predicted_class,
        "probability": float(np.max(prediction))
    }

    return JSONResponse(content=response)
