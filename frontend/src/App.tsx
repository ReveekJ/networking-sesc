import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CreateQuiz from './pages/CreateQuiz';
import HostDashboard from './pages/HostDashboard';
import JoinQuiz from './pages/JoinQuiz';
import TeamRegistration from './pages/TeamRegistration';
import QuizPlayer from './pages/QuizPlayer';
import Statistics from './pages/Statistics';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<CreateQuiz />} />
          <Route path="/host/:inviteCode" element={<HostDashboard />} />
          <Route path="/join/:inviteCode" element={<JoinQuiz />} />
          <Route path="/register/:inviteCode" element={<TeamRegistration />} />
          <Route path="/play/:inviteCode/:participantId" element={<QuizPlayer />} />
          <Route path="/statistics/:inviteCode" element={<Statistics />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

