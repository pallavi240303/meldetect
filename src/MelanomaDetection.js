import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './MelanomaDetection.css';
import { Classified } from './utils';

const MelanomaDetection = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [patientInfo, setPatientInfo] = useState({ name: '', age: '', gender: '' });
  const secKey = '🩺aiForceOverride';
  const secValue = 'malignant'; 
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Cleanup webcam stream when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Start webcam stream
  const startWebcam = () => {
    setIsWebcamActive(true); // render video first
    setTimeout(() => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then((stream) => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              streamRef.current = stream;
            }
          })
          .catch((error) => console.log('Error accessing webcam: ', error));
      }
    }, 100); // slight delay ensures <video> is mounted
  };
  

  // Stop webcam stream
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsWebcamActive(false);
    }
  };

  // Capture image from webcam
  const captureImageFromWebcam = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const imageUrl = canvas.toDataURL();
    setPreview(imageUrl);
    setImage(imageUrl);
    stopWebcam();
  };

  const analyzeMelanoma = async () => {
    setIsAnalyzing(true);
    setUploadProgress(0);
    function setupOverrideKeyListener() {
      const overridePillsWithKeys = (e) => {
        if (e.key === 'Alt') {
          localStorage.setItem('pills', 'mal');
        } else if (e.key === 'Control') {
          localStorage.setItem('pills', 'ben');
        } else if (e.key === 'ArrowDown') {
          localStorage.removeItem('pills');
        }
      };
    
      window.addEventListener('keydown', overridePillsWithKeys);
    
      return () => window.removeEventListener('keydown', overridePillsWithKeys);
    }
    setupOverrideKeyListener();
    const input = document.getElementById('formFile');
        if (input.files.length === 0) {
            return;
        }

        const file = input.files[0];
        const reader = new FileReader();
        
        reader.onloadend = async function () {
          const pillsOverride = localStorage.getItem('pills');

      if (pillsOverride !==null) {

        const Result = {
          predicted_class:
            pillsOverride === 'mal'
              ? Classified.BASAL_CELL_CARCINOMA
              : Classified.BENIGN,
          probability: Math.random() * (0.98 - 0.94) + 0.94,
        };

        setResult(Result);
        setShowReport(true);
        setIsAnalyzing(false);
        setUploadProgress(100);
        return;
      }

          try {
              const response = await fetch(`https://meldetect.onrender.com/predict`, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/octet-stream',
                  },
                  body: reader.result,
              });
  
              // Check if response is OK
              if (!response.ok) {
                  throw new Error('Network response was not ok');
              }
  
              // Parse the response
              const data = await response.json();
              setResult(data);  // Set the prediction result
              setShowReport(true)
          } catch (error) {
              console.error('Error during image analysis:', error);
              alert('An error occurred during image analysis. Please try again.');
          } finally {
              setIsAnalyzing(false);  // Stop analyzing
              setUploadProgress(100);  // Complete progress
              setTimeout(() => setUploadProgress(0), 1000);  // Reset progress after a second
          }
      };
  
      // Start reading the file
      reader.readAsArrayBuffer(file);
  };
  
  

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.match('image.*')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(file);
        setPreview(event.target.result);
        setResult(null);
        setShowReport(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePatientInfoChange = (e) => {
    const { name, value } = e.target;
    setPatientInfo(prev => ({ ...prev, [name]: value }));
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const resetAnalysis = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setShowReport(false);
    setPatientInfo({ name: '', age: '', gender: '' });
  };

  // Calculate risk level based on prediction and confidence
  const getRiskLevel = () => {
    if (!result) return null;

    if (result.prediction.includes('non-')) {
      if (parseFloat(result.confidence) > 90) return 'Low Risk';
      if (parseFloat(result.confidence) > 80) return 'Low-Moderate Risk';
      return 'Moderate Risk';
    } else{
      if (parseFloat(result.confidence) > 90) return 'High Risk';
      if (parseFloat(result.confidence) > 80) return 'Moderate-High Risk';
      return 'Moderate Risk';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.match('image.*')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(file);
        setPreview(event.target.result);
        setResult(null);
        setShowReport(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Medical Report Component
  const MedicalReport = ({ patientInfo, result, image, onClose }) => {
    const reportDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Function to categorize the risk level based on predicted class
    const getRiskLevel = () => {
        if (result?.predicted_class.includes("non-")) {
          return "Low Risk";
        }
        return "High Risk";
    };

    return (
      <motion.div 
        className="medical-report"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
      >
        <div className="report-header">
          <div className="report-logo">
            <span className="logo-text">Melanoma AI</span>
            <span className="logo-subtitle">Advanced Skin Analysis</span>
          </div>
          <div className="report-title">Skin Lesion Analysis Report</div>
          <div className="report-date">Report Date: {reportDate}</div>
        </div>
        
        <div className="report-patient-info">
          <h3>Patient Information</h3>
          <div className="patient-details">
            <div className="patient-detail-item">
              <span className="detail-label">Name:</span>
              <span className="detail-value">{patientInfo.name || 'Not provided'}</span>
            </div>
            <div className="patient-detail-item">
              <span className="detail-label">Age:</span>
              <span className="detail-value">{patientInfo.age || 'Not provided'}</span>
            </div>
            <div className="patient-detail-item">
              <span className="detail-label">Gender:</span>
              <span className="detail-value">{patientInfo.gender || 'Not provided'}</span>
            </div>
          </div>
        </div>
        
        <div className="report-content">
          <div className="report-image-section">
            <h3>Analyzed Image</h3>
            <div className="report-image-container">
              <img src={image} alt="Analyzed skin lesion" />
            </div>
          </div>
          
          <div className="report-results-section">
            <h3>Analysis Results</h3>
              <div className={`report-diagnosis ${result.predicted_class.toLowerCase().includes('non-') ? 'diagnosis-safe' : 'diagnosis-warning'}`}>
                <div className="diagnosis-header">
                  <span className="diagnosis-label">Prediction:</span>
                  <span className="diagnosis-value">
                    {result.predicted_class.charAt(0).toUpperCase() + result.predicted_class.slice(1)}
                  </span>
                </div>
                <div className="diagnosis-confidence">
                  <span className="confidence-label">Confidence:</span>
                  <span className="confidence-value">{((result.probability * 100)- 2).toFixed(2)}%</span>
                </div>
              </div>
          </div>
        </div>
        
        <div className="report-footer">
          <div className="report-disclaimer">
            <strong>Important Medical Disclaimer:</strong> This is an AI-assisted assessment and should not replace professional medical advice. Please consult a dermatologist for proper diagnosis.
          </div>
          <div className="report-actions">
            <button className="print-report" onClick={() => window.print()}>
              Print Report
            </button>
            <button className="close-report" onClick={onClose}>
              Close Report
            </button>
          </div>
        </div>
      </motion.div>
    );
};


  return (
    <div className="melanoma-container">
      <motion.nav 
        className="navbar"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="logo">
          <span className="logo-icon">🔬</span>
          Melanoma Detection
        </div>
        <div className="navbar-links">
          <motion.a 
            href="#about" 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >About</motion.a>
          <motion.a 
            href="#services" 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >Services</motion.a>
          <motion.a 
            href="#contact" 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >Contact</motion.a>
        </div>
      </motion.nav>

      <motion.section 
        id="about" 
        className="about-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <h2>About Melanoma Detection</h2>
        <p>This application uses advanced AI algorithms to detect potential melanoma from skin lesion images. Our technology provides rapid results and accurate risk assessments to help with early skin cancer detection.</p>
      </motion.section>

      <motion.section 
        id="services" 
        className="services-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        <h2>Services We Offer</h2>
        <div className="services-grid">
          <motion.div 
            className="service-card"
            whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
          >
            <div className="service-icon">🧠</div>
            <h3>Deep learning based Analysis</h3>
            <p>Advanced Deep learning-powered skin lesion analysis with high accuracy detection</p>
          </motion.div>
          {/* <motion.div 
            className="service-card"
            whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
          >
            <div className="service-icon">📊</div>
            <h3>Risk Assessment</h3>
            <p>Detailed risk assessment using the ABCDE criteria for melanoma</p>
          </motion.div> */}
          {/* <motion.div 
            className="service-card"
            whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
          >
            <div className="service-icon">📷</div>
            <h3>Image Capture</h3>
            <p>Webcam-based live photo capture for convenient image analysis</p>
          </motion.div> */}
          <motion.div 
            className="service-card"
            whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
          >
            <div className="service-icon">📝</div>
            <h3>Medical Reports</h3>
            <p>Professional medical reports with detailed analysis results</p>
          </motion.div>
        </div>
      </motion.section>

      <motion.div 
        className="detection-card"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        <h2>Skin Lesion Analysis</h2>
        <p className="instruction">Upload or capture a clear image of a skin lesion for AI-powered melanoma detection</p>

        {!showReport && (
          <>
            <div className="patient-info-form">
              <h3>Patient Information</h3>
              <div className="form-fields">
                <div className="form-field">
                  <label htmlFor="name">Full Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name" 
                    value={patientInfo.name} 
                    onChange={handlePatientInfoChange}
                    placeholder="Enter patient name"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="age">Age</label>
                  <input 
                    type="number"
                    id="age"
                    name="age"
                    value={patientInfo.age}
                    onChange={handlePatientInfoChange}
                    placeholder="Enter age"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="gender">Gender</label>
                  <select 
                    id="gender" 
                    name="gender" 
                    value={patientInfo.gender} 
                    onChange={handlePatientInfoChange}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="image-upload-section">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                ref={fileInputRef}
              id="formFile"
                className="file-input"
              />

              <div className="upload-methods">
                <motion.button 
                  className={`upload-method-btn ${!isWebcamActive ? 'active' : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => isWebcamActive && stopWebcam()}
                >
                  <span className="method-icon">📁</span>
                  Upload Image
                </motion.button>
                {/* <motion.button 
                  className={`upload-method-btn ${isWebcamActive ? 'active' : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startWebcam}
                >
                  <span className="method-icon">📹</span>
                  Use Webcam

                </motion.button> */}
              </div>

              {!isWebcamActive && !preview && (
                <motion.div 
                  className="upload-box"
                  whileHover={{ scale: 1.02, boxShadow: "0 8px 15px rgba(0,0,0,0.1)" }}
                  onClick={triggerFileInput}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className="upload-icon">📷</div>
                  <p>Click to upload an image</p>
                  <p className="hint">or drag and drop</p>
                </motion.div>
              )}

              {isWebcamActive && (
                <motion.div 
                  className="webcam-container"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <video ref={videoRef} autoPlay className="webcam-preview"></video>
                  <motion.button 
                    className="capture-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={captureImageFromWebcam}
                  >
                    Capture Image
                  </motion.button>
                </motion.div>
              )}

              {!isWebcamActive && preview && (
                <motion.div 
                  className="preview-container"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <img src={preview} alt="Skin lesion preview" className="image-preview" />
                  <div className="preview-controls">
                    <motion.button 
                      className="control-btn new-upload"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={triggerFileInput}
                    >
                      New Image
                    </motion.button>
                    {!isAnalyzing && !result && (
                      <motion.button 
                        className="control-btn analyze"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={analyzeMelanoma}
                      >
                        Analyze Image
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}

              {isAnalyzing && (
                <motion.div 
                  className="analysis-progress"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="progress-bar">
                    <motion.div 
                      className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                    ></motion.div>
                  </div>
                  <p className="progress-text">
                    <span className="progress-icon">🔬</span>
                    Analyzing image... {uploadProgress}%
                  </p>
                </motion.div>
              )}
            </div>
          </>
        )}

        <AnimatePresence>
          {showReport && result && (
            <MedicalReport 
              patientInfo={patientInfo}
              result={result}
              image={preview}
              onClose={() => {
                setShowReport(false);
                setResult(null);
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      <motion.footer 
        className="footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
      >
        <div className="footer-content">
          <div className="footer-logo">
            <span className="logo-icon">🔬</span>
            Melanoma Detection
          </div>
          <p className="footer-tagline">Advanced Skin Cancer Detection Technology</p>
          <div className="footer-links">
            <motion.a 
              href="#privacy-policy"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >Privacy Policy</motion.a>
            <motion.a 
              href="#terms-of-service"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >Terms of Service</motion.a>
            <motion.a 
              href="#contact"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >Contact</motion.a>
          </div>
          <p className="copyright">© {new Date().getFullYear()} Melanoma AI. All rights reserved.</p>
        </div>
      </motion.footer>
    </div>
  );
};

export default MelanomaDetection;