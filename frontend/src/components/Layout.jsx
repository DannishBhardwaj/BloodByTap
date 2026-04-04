import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/slices/authSlice'
import { FaHome, FaBell, FaExclamationTriangle, FaUser, FaSignOutAlt } from 'react-icons/fa'

const Layout = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="container">
          <div className="nav-content">
            <Link to="/dashboard" className="logo">
              <span className="logo-icon">🩸</span>
              <span className="logo-text">BloodByTap</span>
            </Link>
            
            <div className="nav-links">
              <Link to="/dashboard" className="nav-link">
                <FaHome /> Dashboard
              </Link>
              {user?.role === 'institution' && (
                <>
                  <Link to="/alerts" className="nav-link">
                    <FaBell /> Alerts
                  </Link>
                  <Link to="/alerts/create" className="nav-link">
                    Create Alert
                  </Link>
                </>
              )}
              {user?.role === 'donor' && (
                <Link to="/emergencies/report" className="nav-link">
                  <FaExclamationTriangle /> Report Emergency
                </Link>
              )}
              <Link to="/profile" className="nav-link">
                <FaUser /> Profile
              </Link>
              <button onClick={handleLogout} className="nav-link btn-logout">
                <FaSignOutAlt /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <div className="container">
          <Outlet />
        </div>
      </main>

      <style>{`
        .app-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .navbar {
          background: white;
          border-bottom: 1px solid var(--border);
          padding: 0.75rem 0;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .nav-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--primary);
          text-decoration: none;
        }
        .logo-icon {
          font-size: 1.25rem;
        }
        .nav-links {
          display: flex;
          gap: 0.25rem;
          align-items: center;
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          color: var(--text-secondary);
          text-decoration: none;
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          transition: background-color 0.15s, color 0.15s;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
        }
        .nav-link:hover {
          background-color: var(--bg);
          color: var(--text);
        }
        .btn-logout {
          color: var(--danger);
        }
        .btn-logout:hover {
          background-color: #fee2e2;
          color: var(--danger);
        }
        .main-content {
          flex: 1;
          padding: 1.5rem 0;
        }
        @media (max-width: 768px) {
          .nav-content {
            flex-direction: column;
            gap: 0.75rem;
          }
          .nav-links {
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}

export default Layout
