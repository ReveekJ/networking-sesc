import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import TeamSurvey from './pages/TeamSurvey';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/survey/:inviteCode" element={<TeamSurvey />} />
      </Routes>
    </Router>
  );
}

export default App;

