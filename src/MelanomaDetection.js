import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Loader, AlertCircle, Check, X, ChevronDown, ChevronUp, History, Sun, Moon } from 'lucide-react';
import './MelanomaDetection.css';

function MelanomaDetection() {
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('melanomaHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history from localStorage');
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('melanomaHistory', JSON.stringify(history));
  }, [history]);

  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
        setIsCameraOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

 // Replace the openCamera function with this improved version:
const openCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      console.log('Attempting to access camera...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true // Simplified constraints
      });
      
      console.log('Camera access granted');
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setIsCameraOpen(true);
      setError(null);
    } catch (err) {
      console.error('Camera access error:', err);
      setError(`Camera access failed: ${err.message || 'Unknown error'}`);
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImage(dataUrl);
      
      // Stop the camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsCameraOpen(false);
    }
  };

  const resetImage = () => {
    setImage(null);
    setResult(null);
    setError(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const analyzeImage = async () => {
    if (!image) {
      setError('Please upload or capture an image first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Simulating API call since we don't have a real backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate a response (in a real app, this would come from your API)
      const mockResults = {
        prediction: Math.random() > 0.7 ? 'Malignant' : 'Benign',
        confidence: (0.6 + Math.random() * 0.35).toFixed(2),
        date: new Date().toISOString()
      };
      
      setResult(mockResults);
      
      // Add to history
      const historyItem = {
        ...mockResults,
        imageUrl: image
      };
      
      setHistory(prev => [historyItem, ...prev.slice(0, 9)]);
    } catch (err) {
      setError('Failed to analyze image. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const themeMode = darkMode ? 'dark' : 'light';

  return (
    <div className={`app-container ${themeMode}`}>
      <div className="content-container">
        {/* Header */}
        <header className="header">
          <h1 className="app-title">Melanoma Detection Tool</h1>
          <button 
            onClick={toggleTheme} 
            className={`theme-toggle ${themeMode}`}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        {/* Main Content */}
        <main>
          {/* Image Input Section */}
          <div className={`card ${themeMode}`}>
            <h2 className="card-title">Upload or Capture Skin Lesion Image</h2>
            
            {/* Image Preview */}
            {image && !isCameraOpen && (
              <div className="image-container">
                <img 
                  src={image} 
                  alt="Skin lesion preview" 
                  className="preview-image" 
                />
                <button 
                  onClick={resetImage}
                  className="remove-image-btn"
                  aria-label="Remove image"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            
            {/* Camera View */}
            {isCameraOpen && (
              <div className="video-container">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="camera-video"
                />
                <div className="camera-controls">
                  <button 
                    onClick={captureImage}
                    className="btn btn-primary"
                  >
                    Capture Photo
                  </button>
                  <button 
                    onClick={() => {
                      if (streamRef.current) {
                        streamRef.current.getTracks().forEach(track => track.stop());
                      }
                      setIsCameraOpen(false);
                    }}
                    className={`btn btn-secondary ${themeMode}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            {/* Input Options */}
            {!isCameraOpen && !result && (
              <div className="button-container">
                <button 
                  onClick={() => fileInputRef.current.click()}
                  className="btn btn-primary"
                >
                  <Upload size={20} className="btn-icon" />
                  Upload Image
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                  aria-label="Upload image"
                />
                
                <button 
                  onClick={openCamera}
                  className="btn btn-primary"
                >
                  <Camera size={20} className="btn-icon" />
                  Use Camera
                </button>
                
                {image && (
                  <button 
                    onClick={analyzeImage}
                    className="btn btn-success"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader size={20} className="btn-icon" style={{ animation: 'spin 1s linear infinite' }} />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Check size={20} className="btn-icon" />
                        Analyze Image
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
            
            {/* Error Message */}
            {error && (
              <div className="error-message">
                <AlertCircle size={20} className="error-icon" />
                {error}
              </div>
            )}
          </div>
          
          {/* Results Section */}
          {result && (
            <div className={`card ${themeMode}`}>
              <h2 className="card-title">Analysis Results</h2>
              
              <div className="results-container">
                {/* Image */}
                <div className="results-image">
                  <img 
                    src={image} 
                    alt="Analyzed skin lesion" 
                    className="preview-image" 
                  />
                </div>
                
                {/* Results */}
                <div className="results-details">
                  <div className={`prediction-container ${result.prediction.toLowerCase()}`}>
                    <div className="prediction-header">
                      <h3 className="prediction-title">Prediction:</h3>
                      <span className="prediction-value">{result.prediction}</span>
                    </div>
                    <div className="confidence-container">
                      <h3 className="confidence-title">Confidence Level:</h3>
                      <div className="confidence-bar-container">
                        <div className="confidence-bar-bg">
                          <div 
                            className={`confidence-bar ${result.prediction.toLowerCase()}`}
                            style={{ width: `${parseFloat(result.confidence) * 100}%` }}
                          ></div>
                        </div>
                        <span>{(parseFloat(result.confidence) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="section-content">
                    <h3 className="section-title">Interpretation:</h3>
                    <p>
                      {result.prediction === 'Benign' 
                        ? 'The analyzed image shows characteristics consistent with a benign skin lesion. This suggests a lower risk of melanoma.'
                        : 'The analyzed image shows characteristics consistent with a potentially malignant skin lesion. This indicates a higher risk of melanoma.'}
                    </p>
                  </div>
                  
                  <div className="section-content">
                    <h3 className="section-title">Recommendations:</h3>
                    <ul className="recommendation-list">
                      {result.prediction === 'Benign' ? (
                        <>
                          <li>Continue to monitor the lesion for any changes in size, shape, or color.</li>
                          <li>Perform regular skin self-examinations.</li>
                          <li>Use sun protection consistently.</li>
                        </>
                      ) : (
                        <>
                          <li>Consult a dermatologist promptly for professional evaluation.</li>
                          <li>Consider scheduling a biopsy for definitive diagnosis.</li>
                          <li>Continue to monitor for any changes in the lesion.</li>
                        </>
                      )}
                      <li>Schedule regular skin checks with a healthcare provider.</li>
                    </ul>
                  </div>
                  
                  <div className="disclaimer">
                    <strong className="disclaimer-bold">Disclaimer:</strong> This tool provides preliminary analysis only and is not a substitute for medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider regarding any medical conditions.
                  </div>
                  
                  <div className="button-container" style={{ marginTop: '1rem' }}>
                    <button 
                      onClick={resetImage}
                      className={`btn btn-secondary ${themeMode}`}
                    >
                      Analyze Another Image
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* History Section */}
          {history.length > 0 && (
            <div className={`card ${themeMode}`}>
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="history-header"
              >
                <div className="history-header-text">
                  <History size={20} className="history-icon" />
                  History
                </div>
                {showHistory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              {showHistory && (
                <div className="history-list">
                  {history.map((item, index) => (
                    <div key={index} className={`history-item ${themeMode}`}>
                      <div className="history-item-image">
                        <img 
                          src={item.imageUrl} 
                          alt={`Historical scan ${index + 1}`}
                          className="history-image" 
                        />
                      </div>
                      <div className="history-item-details">
                        <div className="history-item-header">
                          <div className={`history-badge ${item.prediction.toLowerCase()}`}>
                            {item.prediction}
                          </div>
                          <div className="history-date">
                            {new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="history-confidence">
                          <span className="history-confidence-text">Confidence:</span>
                          <div className="history-confidence-bar-bg">
                            <div 
                              className={`history-confidence-bar ${item.prediction.toLowerCase()}`}
                              style={{ width: `${parseFloat(item.confidence) * 100}%` }}
                            ></div>
                          </div>
                          <span className="history-confidence-value">{(parseFloat(item.confidence) * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
        
        {/* Footer */}
        <footer className="footer">
          <p>Melanoma Detection Tool - For educational purposes only</p>
          <p>Consult healthcare professionals for medical advice</p>
        </footer>
      </div>
    </div>
  );
}

export default MelanomaDetection;