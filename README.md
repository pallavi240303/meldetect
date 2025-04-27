# Skin Cancer Detection Project

This repository contains a machine learning project for skin cancer detection using deep learning techniques.

## Project Overview

This project implements a skin cancer detection system using Python and deep learning. It provides a web interface for users to upload skin images and get predictions about potential skin cancer conditions.

## Prerequisites

- Python 3.9 or higher
- pip (Python package installer)
- Virtual environment (recommended)

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/abdulsaheel/melanoma-skin-detection.git
cd melanoma-skin-detection
```

### Setting Up Virtual Environment

1. Create a virtual environment:
```bash
python3 -m venv env
```

2. Activate the virtual environment:

For macOS/Linux:
```bash
source env/bin/activate
```

For Windows:
```bash
.\env\Scripts\activate
```

### Installing Dependencies

Install all required packages using pip:
```bash
pip install -r requirements.txt
```

This will install all necessary libraries including:
- TensorFlow for deep learning
- Flask for web application
- Other required dependencies

## Project Structure

```plaintext
melanoma-skin-detection/
├── .gitignore           # Git ignore file
├── README.md           # Project documentation
├── main.py            # Main application file
├── model.h5           # Trained model file
├── requirements.txt   # Project dependencies
├── skin_cancer_detection.py  # Detection logic
└── templates/         # HTML templates
    └── index.html    # Main web interface
```

## Running the Application

1. Make sure your virtual environment is activated

2. Start the FastAPI pplication:
```bash
uvicorn main:app --reload
```

## Accessing the Application

Once the application is running:

1. Open your web browser
2. Navigate to `http://localhost:5000` or `http://127.0.0.1:5000`
3. You should see the skin cancer detection interface where you can upload images for analysis

## Usage

1. Access the web interface through your browser
2. Upload a skin image using the provided interface
3. Click the submit/analyze button
4. Wait for the system to process and display the results

## Important Notes

- Make sure to use high-quality images for better prediction accuracy
- The system works best with clear, well-lit images of skin lesions
- This tool is for educational purposes and should not replace professional medical advice

