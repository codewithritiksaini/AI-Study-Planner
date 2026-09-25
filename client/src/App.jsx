import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import AdminRoute from './components/common/AdminRoute.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import LandingPage from './pages/LandingPage.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Planner from './pages/Planner.jsx';
import Subjects from './pages/Subjects.jsx';
import SubjectDetails from './pages/SubjectDetails.jsx';
import Study from './pages/Study.jsx';
import StudyRoom from './pages/StudyRoom.jsx';
import StudyReview from './pages/StudyReview.jsx';
import Quiz from './pages/Quiz.jsx';
import Progress from './pages/Progress.jsx';
import Analytics from './pages/Analytics.jsx';
import Recommendations from './pages/Recommendations.jsx';
import AIAssistant from './pages/AIAssistant.jsx';
import AITutor from './pages/AITutor.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import InterviewDemo from './pages/InterviewDemo.jsx';
import NotFound from './pages/NotFound.jsx';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Application Routes (Requires Verified Student Session) */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/subjects/:id" element={<SubjectDetails />} />
            <Route path="/study" element={<Study />} />
            <Route path="/study/room" element={<StudyRoom />} />
            <Route path="/study/room/:id" element={<StudyRoom />} />
            <Route path="/study/review/:topicId" element={<StudyReview />} />
            <Route path="/ai" element={<AIAssistant />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/ai-tutor" element={<AITutor />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />

            {/* Platform Administration Console (Strictly Protected for Admins) */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <InterviewDemo />
                </AdminRoute>
              }
            />
            <Route
              path="/interview-demo"
              element={
                <AdminRoute>
                  <InterviewDemo />
                </AdminRoute>
              }
            />
          </Route>

          {/* 404 Catch-All Page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>
  );
}

export default App;
