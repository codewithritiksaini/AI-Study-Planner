import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout.jsx';
import LandingPage from './pages/LandingPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Planner from './pages/Planner.jsx';
import Subjects from './pages/Subjects.jsx';
import Study from './pages/Study.jsx';
import Quiz from './pages/Quiz.jsx';
import Progress from './pages/Progress.jsx';
import Analytics from './pages/Analytics.jsx';
import AITutor from './pages/AITutor.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import NotFound from './pages/NotFound.jsx';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Root Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Main Application Shell with Shared Sidebar & Header */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/study" element={<Study />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/ai-tutor" element={<AITutor />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
