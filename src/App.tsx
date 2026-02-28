import { Routes, Route, Navigate } from 'react-router-dom'
import { SpeedInsights } from "@vercel/speed-insights/react"
import { useAuth } from './hooks/useAuth'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import StudyNew from './pages/StudyNew'
import StudyList from './pages/StudyList'
import Stats from './pages/Stats'
import ExamAnalysis from './pages/ExamAnalysis'
import TopicPrediction from './pages/TopicPrediction'
import Tutor from './pages/Tutor'
import Leaderboard from './pages/Leaderboard'
import AttendancePage from './pages/AttendancePage'
import Games from './pages/Games'
import ExamHub from './pages/ExamPrep/ExamHub'
import ExamDetail from './pages/ExamPrep/ExamDetail'
import About from './pages/About'
import Privacy from './pages/Privacy'
import Contact from './pages/Contact'
import AuthCallback from './pages/AuthCallback'
import ToolsHub from './pages/ToolsHub'
import DiagnosticLanding from './pages/DiagnosticLanding'
import DiagnosticSession from './pages/DiagnosticSession'
import DiagnosticResult from './pages/DiagnosticResult'
import LearningPlan from './pages/LearningPlan'
import Settings from './pages/Settings'
import AppShell from './components/AppShell'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <AppShell>{children}</AppShell>
}

import { useEffect } from 'react';
import { callGemini } from './lib/api';

function App() {
  // Cold start warmup - fire and forget
  useEffect(() => {
    callGemini('health', {}).catch(() => { });
  }, []);

  return (
    <>
      <SpeedInsights />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected Routes wrapped in AppShell via ProtectedRoute */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/diagnostic" element={<ProtectedRoute><DiagnosticLanding /></ProtectedRoute>} />
        <Route path="/diagnostic/session/:id" element={<ProtectedRoute><DiagnosticSession /></ProtectedRoute>} />
        <Route path="/diagnostic/result/:id" element={<ProtectedRoute><DiagnosticResult /></ProtectedRoute>} />
        <Route path="/learning-plan" element={<ProtectedRoute><LearningPlan /></ProtectedRoute>} />
        <Route path="/tools" element={<ProtectedRoute><ToolsHub /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        <Route path="/attendance-tracker" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
        <Route path="/study/new" element={<ProtectedRoute><StudyNew /></ProtectedRoute>} />
        <Route path="/study/list" element={<ProtectedRoute><StudyList /></ProtectedRoute>} />
        <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
        <Route path="/exam-analysis" element={<ProtectedRoute><ExamAnalysis /></ProtectedRoute>} />
        <Route path="/exam-prediction" element={<ProtectedRoute><TopicPrediction /></ProtectedRoute>} />
        <Route path="/tutor" element={<ProtectedRoute><Tutor /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/games" element={<ProtectedRoute><Games /></ProtectedRoute>} />
        <Route path="/exam-prep" element={<ProtectedRoute><ExamHub /></ProtectedRoute>} />
        <Route path="/exam-prep/:id" element={<ProtectedRoute><ExamDetail /></ProtectedRoute>} />

        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
