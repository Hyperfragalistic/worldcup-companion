import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { SupabaseProvider, useSupabase } from './providers/SupabaseProvider'
import AuthPage     from './pages/AuthPage'
import SchedulePage from './pages/SchedulePage'
import MatchPage    from './pages/MatchPage'
import ProfilePage  from './pages/ProfilePage'

function Spinner() {
  return (
    <div className="flex h-dvh items-center justify-center bg-wc-dark">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-wc-gold border-t-transparent" />
    </div>
  )
}

// Auth guard — loading is already resolved by AppRoutes before this renders.
// Saves the intended destination in location state so AuthPage can redirect
// back after a successful sign-in (works for OTP; magic link always lands on /).
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session } = useSupabase()
  const location    = useLocation()
  if (!session) return <Navigate to="/auth" state={{ from: location }} replace />
  return <>{children}</>
}

function AppRoutes() {
  const { session, loading } = useSupabase()

  // Single loading gate — holds all routes until the initial session
  // check resolves, preventing both a flash-of-auth-page and a flash of
  // protected content before Supabase confirms the session.
  if (loading) return <Spinner />

  return (
    <Routes>
      {/* Bounce already-authenticated users away from the auth page */}
      <Route path="/auth" element={session ? <Navigate to="/" replace /> : <AuthPage />} />

      <Route path="/" element={
        <ProtectedRoute><SchedulePage /></ProtectedRoute>
      } />

      <Route path="/match/:id" element={
        <ProtectedRoute><MatchPage /></ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute><ProfilePage /></ProtectedRoute>
      } />

      {/* Auth-aware catch-all: skip the double-redirect through ProtectedRoute */}
      <Route path="*" element={<Navigate to={session ? '/' : '/auth'} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <SupabaseProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </SupabaseProvider>
  )
}
