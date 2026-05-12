import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import LandingDark from './screens/Landing_Dark';
import LoginDark from './screens/Login_Dark';
import DashboardDark from './screens/Dashboard_Dark';
import FileUploadDark from './screens/FileUpload_Dark';
import AnalysisResultsDark from './screens/AnalysisResults_Dark';
import ChatInterfaceDark from './screens/ChatInterface_Dark';
import ReviewDetailDark from './screens/ReviewDetail_Dark';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingDark />} />
        <Route path="/login" element={<LoginDark />} />
        <Route path="/dashboard" element={<DashboardDark />} />
        <Route path="/upload" element={<FileUploadDark />} />
        <Route path="/analysis" element={<AnalysisResultsDark />} />
        <Route path="/chat" element={<ChatInterfaceDark />} />
        <Route path="/review" element={<ReviewDetailDark />} />
      </Routes>
    </Router>
  );
}

export default App;
