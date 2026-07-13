import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import LandingDark from './pages/Landing_Dark';
import FeaturesDark from './pages/Features_Dark';
import LoginDark from './pages/Login_Dark';
import DashboardDark from './pages/Dashboard_Dark';
import FileUploadDark from './pages/FileUpload_Dark';
import AnalysisResultsDark from './pages/AnalysisResults_Dark';
import ChatInterfaceDark from './pages/ChatInterface_Dark';
import ReviewDetailDark from './pages/ReviewDetail_Dark';

import { AuthProvider } from './AuthContext';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<LandingDark />} />
          <Route path="/features" element={<FeaturesDark />} />
          <Route path="/login" element={<LoginDark />} />
          <Route path="/dashboard" element={<DashboardDark />} />
          <Route path="/upload" element={<FileUploadDark />} />
          <Route path="/analysis" element={<AnalysisResultsDark />} />
          <Route path="/chat" element={<ChatInterfaceDark />} />
          <Route path="/review" element={<ReviewDetailDark />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
