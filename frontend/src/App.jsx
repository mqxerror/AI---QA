import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { PageTransition } from './components/ui/framer'
import NewDashboard from './pages/NewDashboard'
import Websites from './pages/Websites'
import TestRuns from './pages/TestRuns'
import SystemStatus from './pages/SystemStatus'
import ActivityLog from './pages/ActivityLog'
import ProcessMonitor from './pages/ProcessMonitor'
import FailureManager from './pages/FailureManager'
import Help from './pages/Help'
import Login from './pages/Login'
import './App.css'

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

// Layout with navbar
function Layout() {
  const location = useLocation()
  const { user, logout } = useAuth()

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>QA Testing Dashboard</h1>
        </div>
        <div className="navbar-menu">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            Dashboard
          </Link>
          <Link to="/websites" className={location.pathname === '/websites' ? 'active' : ''}>
            Websites
          </Link>
          <Link to="/test-runs" className={location.pathname === '/test-runs' ? 'active' : ''}>
            Test Runs
          </Link>
          <Link to="/failures" className={location.pathname === '/failures' ? 'active' : ''}>
            Failures
          </Link>
          <Link to="/activities" className={location.pathname === '/activities' ? 'active' : ''}>
            Activity Log
          </Link>
          <Link to="/processes" className={location.pathname === '/processes' ? 'active' : ''}>
            Processes
          </Link>
          <Link to="/status" className={location.pathname === '/status' ? 'active' : ''}>
            System Status
          </Link>
          <Link to="/help" className={location.pathname === '/help' ? 'active' : ''}>
            Help
          </Link>
        </div>
        <div className="navbar-user">
          <span className="user-info">{user?.username}</span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <main className="container">
        <Routes>
          <Route path="/" element={<PageTransition><NewDashboard /></PageTransition>} />
          <Route path="/websites" element={<PageTransition><Websites /></PageTransition>} />
          <Route path="/test-runs" element={<PageTransition><TestRuns /></PageTransition>} />
          <Route path="/failures" element={<PageTransition><FailureManager /></PageTransition>} />
          <Route path="/activities" element={<PageTransition><ActivityLog /></PageTransition>} />
          <Route path="/processes" element={<PageTransition><ProcessMonitor /></PageTransition>} />
          <Route path="/status" element={<PageTransition><SystemStatus /></PageTransition>} />
          <Route path="/help" element={<PageTransition><Help /></PageTransition>} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  )
}

export default App
