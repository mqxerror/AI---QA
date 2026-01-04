import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { PageTransition } from './components/ui/framer'
import {
  IconLayoutDashboard,
  IconWorld,
  IconFlask,
  IconSettings,
  IconHelp,
  IconLogout
} from '@tabler/icons-react'
import Dashboard from './pages/Dashboard'
import Websites from './pages/Websites'
import TestRuns from './pages/TestRunsEnhanced'
import SystemStatus from './pages/SystemStatus'
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

// Layout with Tabler sidebar
function Layout() {
  const location = useLocation()
  const { user, logout } = useAuth()

  return (
    <div className="page">
      {/* Sidebar */}
      <aside className="navbar navbar-vertical navbar-expand-lg" data-bs-theme="dark">
        <div className="container-fluid">
          <h1 className="navbar-brand navbar-brand-autodark">
            <span className="navbar-brand-image">
              QA Testing Dashboard
            </span>
          </h1>

          <div className="navbar-nav">
            <Link
              to="/"
              className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
            >
              <span className="nav-link">
                <span className="nav-link-icon d-md-none d-lg-inline-block">
                  <IconLayoutDashboard size={24} stroke={1.5} />
                </span>
                <span className="nav-link-title">Dashboard</span>
              </span>
            </Link>

            <Link
              to="/websites"
              className={`nav-item ${location.pathname === '/websites' ? 'active' : ''}`}
            >
              <span className="nav-link">
                <span className="nav-link-icon d-md-none d-lg-inline-block">
                  <IconWorld size={24} stroke={1.5} />
                </span>
                <span className="nav-link-title">Websites</span>
              </span>
            </Link>

            <Link
              to="/test-runs"
              className={`nav-item ${location.pathname === '/test-runs' ? 'active' : ''}`}
            >
              <span className="nav-link">
                <span className="nav-link-icon d-md-none d-lg-inline-block">
                  <IconFlask size={24} stroke={1.5} />
                </span>
                <span className="nav-link-title">Test Runs</span>
              </span>
            </Link>

            <Link
              to="/status"
              className={`nav-item ${location.pathname === '/status' ? 'active' : ''}`}
            >
              <span className="nav-link">
                <span className="nav-link-icon d-md-none d-lg-inline-block">
                  <IconSettings size={24} stroke={1.5} />
                </span>
                <span className="nav-link-title">System Status</span>
              </span>
            </Link>

            <Link
              to="/help"
              className={`nav-item ${location.pathname === '/help' ? 'active' : ''}`}
            >
              <span className="nav-link">
                <span className="nav-link-icon d-md-none d-lg-inline-block">
                  <IconHelp size={24} stroke={1.5} />
                </span>
                <span className="nav-link-title">Help</span>
              </span>
            </Link>
          </div>

          <div className="navbar-nav mt-auto">
            <div className="nav-item dropdown">
              <div className="nav-link d-flex lh-1 text-reset p-0">
                <div className="d-none d-xl-block ps-2">
                  <div>{user?.username}</div>
                </div>
              </div>
            </div>
            <button onClick={logout} className="btn btn-danger w-100 mt-2">
              <IconLogout size={18} className="me-2" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="page-wrapper">
        <div className="page-body">
          <div className="container-xl">
            <Routes>
              <Route path="/" element={<PageTransition><Dashboard /></PageTransition>} />
              <Route path="/websites" element={<PageTransition><Websites /></PageTransition>} />
              <Route path="/test-runs" element={<PageTransition><TestRuns /></PageTransition>} />
              <Route path="/status" element={<PageTransition><SystemStatus /></PageTransition>} />
              <Route path="/help" element={<PageTransition><Help /></PageTransition>} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          } />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
