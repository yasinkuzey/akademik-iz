import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import StudyNew from './pages/StudyNew'
import StudyList from './pages/StudyList'
import Stats from './pages/Stats'
import ExamAnalysis from './pages/ExamAnalysis'
import ExamPrediction from './pages/ExamPrediction'
import Tutor from './pages/Tutor'
import Leaderboard from './pages/Leaderboard'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[rgb(var(--muted))]">Yükleniyor...</div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/study/new"
        element={
          <ProtectedRoute>
            <Layout><StudyNew /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/study/list"
        element={
          <ProtectedRoute>
            <Layout><StudyList /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stats"
        element={
          <ProtectedRoute>
            <Layout><Stats /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam-analysis"
        element={
          <ProtectedRoute>
            <Layout><ExamAnalysis /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam-prediction"
        element={
          <ProtectedRoute>
            <Layout><ExamPrediction /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tutor"
        element={
          <ProtectedRoute>
            <Layout><Tutor /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <Layout><Leaderboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
