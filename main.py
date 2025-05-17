from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from PIL import Image
import numpy as np
import skin_cancer_detection as SCD
import io
import os
import uuid
import asyncio
from datetime import datetime
import tensorflow as tf
from tensorflow.keras.callbacks import EarlyStopping
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
templates = Jinja2Templates(directory="templates")
NEW_TRAINING_DIR = "new_training_data"
os.makedirs(NEW_TRAINING_DIR, exist_ok=True)

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

@app.post("/upload_training_image/{class_idx}")
async def upload_training_image(class_idx: int, request: Request):
    image_data = await request.body()
    img = Image.open(io.BytesIO(image_data))

    # Save image with class_idx in filename
    filename = f"{class_idx}_{uuid.uuid4().hex}.png"
    filepath = os.path.join(NEW_TRAINING_DIR, filename)
    img.save(filepath)

    # Check if enough images collected for retraining
    if len(os.listdir(NEW_TRAINING_DIR)) >= 100:
        asyncio.create_task(run_retraining())

    return {"message": "Image saved for training", "filename": filename}

def load_training_data_from_folder(folder_path):
    images = []
    labels = []

    for filename in os.listdir(folder_path):
        if filename.lower().endswith((".png", ".jpg", ".jpeg")):
            try:
                class_idx = int(filename.split("_")[0])
            except Exception:
                continue  # skip files not matching naming pattern
            labels.append(class_idx)

            img_path = os.path.join(folder_path, filename)
            img = Image.open(img_path).resize((28, 28))
            img_array = np.array(img)
            if img_array.shape == (28, 28):  # grayscale to 3-channel
                img_array = np.stack([img_array]*3, axis=-1)
            images.append(img_array)

    x_train = np.array(images) / 255.0
    y_train = np.array(labels)
    y_train = tf.keras.utils.to_categorical(y_train, num_classes=7)
    return x_train, y_train


def clear_training_folder(folder_path):
    for f in os.listdir(folder_path):
        os.remove(os.path.join(folder_path, f))


async def run_retraining():
    print("Starting retraining...")
    x_train, y_train = load_training_data_from_folder(NEW_TRAINING_DIR)
    if len(x_train) == 0:
        print("No new training data found, skipping retraining.")
        return

    callback = EarlyStopping(monitor='val_loss', patience=3, restore_best_weights=True)
    start_time = datetime.now()

    history = SCD.model.fit(
        x_train,
        y_train,
        validation_split=0.2,
        batch_size=128,
        epochs=50,
        shuffle=True,
        callbacks=[callback]
    )

    end_time = datetime.now()
    print(f"Retraining completed in: {end_time - start_time}")

    SCD.model.save_weights("model.h5")
    print("Model weights saved.")

    clear_training_folder(NEW_TRAINING_DIR)
    print("Cleared training data folder.")
