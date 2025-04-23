import React, { useState, useRef } from 'react';
import './MelanomaDetection.css';

const MelanomaDetection = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Simulate ML prediction with mock results
  const analyzeMelanoma = () => {
    setIsAnalyzing(true);
    
    // Progress animation
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        
        // Mock analysis results - in a real app, this would come from an API
        setTimeout(() => {
          const mockResult = {
            prediction: Math.random() > 0.5 ? 'benign' : 'malignant',
            confidence: (Math.random() * 30 + 70).toFixed(2), // 70-100% confidence
            details: {
              asymmetry: (Math.random() * 100).toFixed(2),
              border: (Math.random() * 100).toFixed(2),
              color: (Math.random() * 100).toFixed(2),
              diameter: (Math.random() * 100).toFixed(2),
              evolution: (Math.random() * 100).toFixed(2),
            }
          };
          
          setResult(mockResult);
          setIsAnalyzing(false);
          setUploadProgress(0);
        }, 1000);
      }
    }, 50);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.match('image.*')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(file);
        setPreview(event.target.result);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const resetAnalysis = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
  };

  // Calculate risk level based on prediction and confidence
  const getRiskLevel = () => {
    if (!result) return null;
    
    if (result.prediction === 'malignant') {
      if (parseFloat(result.confidence) > 90) return 'High Risk';
      if (parseFloat(result.confidence) > 80) return 'Moderate-High Risk';
      return 'Moderate Risk';
    } else {
      if (parseFloat(result.confidence) > 90) return 'Low Risk';
      if (parseFloat(result.confidence) > 80) return 'Low-Moderate Risk';
      return 'Moderate Risk';
    }
  };

  return (
    <div className="melanoma-container">
      <div className="detection-card">
        <h2>Skin Lesion Analysis</h2>
        <p className="instruction">Upload a clear image of a skin lesion for AI-powered melanoma detection</p>

        <div className="upload-section">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange} 
            ref={fileInputRef}
            className="file-input"
          />

          {!preview ? (
            <div className="upload-box" onClick={triggerFileInput}>
              <div className="upload-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p>Click to upload an image</p>
              <p className="hint">or drag and drop</p>
            </div>
          ) : (
            <div className="preview-container">
              <img src={preview} alt="Skin lesion preview" className="image-preview" />
              <div className="preview-controls">
                <button className="control-btn new-upload" onClick={triggerFileInput}>
                  New Image
                </button>
                {!isAnalyzing && !result && (
                  <button className="control-btn analyze" onClick={analyzeMelanoma}>
                    Analyze Image
                  </button>
                )}
                {result && (
                  <button className="control-btn reset" onClick={resetAnalysis}>
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {isAnalyzing && (
          <div className="analysis-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p>Analyzing image... {uploadProgress}%</p>
          </div>
        )}

        {result && (
          <div className={`results-panel ${result.prediction === 'malignant' ? 'warning' : 'safe'}`}>
            <h3>Analysis Results</h3>
            <div className="prediction-result">
              <div className="result-indicator">
                <span className={`status-dot ${result.prediction === 'malignant' ? 'red' : 'green'}`}></span>
              </div>
              <div className="result-details">
                <p className="prediction">
                  <strong>Prediction:</strong> {result.prediction.charAt(0).toUpperCase() + result.prediction.slice(1)}
                </p>
                <p className="confidence">
                  <strong>Confidence:</strong> {result.confidence}%
                </p>
                <p className="risk-level">
                  <strong>Risk Assessment:</strong> {getRiskLevel()}
                </p>
              </div>
            </div>

            <div className="abcde-results">
              <h4>ABCDE Criteria Analysis</h4>
              <div className="criteria-grid">
                <div className="criteria-item">
                  <span className="criteria-label">Asymmetry</span>
                  <div className="criteria-bar">
                    <div className="criteria-fill" style={{ width: `${result.details.asymmetry}%` }}></div>
                  </div>
                  <span className="criteria-value">{result.details.asymmetry}%</span>
                </div>
                <div className="criteria-item">
                  <span className="criteria-label">Border</span>
                  <div className="criteria-bar">
                    <div className="criteria-fill" style={{ width: `${result.details.border}%` }}></div>
                  </div>
                  <span className="criteria-value">{result.details.border}%</span>
                </div>
                <div className="criteria-item">
                  <span className="criteria-label">Color</span>
                  <div className="criteria-bar">
                    <div className="criteria-fill" style={{ width: `${result.details.color}%` }}></div>
                  </div>
                  <span className="criteria-value">{result.details.color}%</span>
                </div>
                <div className="criteria-item">
                  <span className="criteria-label">Diameter</span>
                  <div className="criteria-bar">
                    <div className="criteria-fill" style={{ width: `${result.details.diameter}%` }}></div>
                  </div>
                  <span className="criteria-value">{result.details.diameter}%</span>
                </div>
                <div className="criteria-item">
                  <span className="criteria-label">Evolution</span>
                  <div className="criteria-bar">
                    <div className="criteria-fill" style={{ width: `${result.details.evolution}%` }}></div>
                  </div>
                  <span className="criteria-value">{result.details.evolution}%</span>
                </div>
              </div>
            </div>

            <div className="disclaimer">
              <strong>Important:</strong> This is an AI-assisted assessment and should not replace professional medical advice. Please consult a dermatologist for proper diagnosis.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MelanomaDetection;