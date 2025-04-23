import React from 'react';
import MelanomaDetection from './MelanomaDetection';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>MelanomaScan</h1>
          <p>AI-powered skin lesion analysis</p>
        </div>
      </header>
      
      <main className="app-main">
        <MelanomaDetection />
      </main>
      
      <footer className="app-footer">
        <p>
          <strong>Disclaimer:</strong> This application is for educational purposes only.
          Always consult a healthcare professional for medical advice.
        </p>
        <p>© 2025 MelanomaScan</p>
      </footer>
    </div>
  );
}

export default App;