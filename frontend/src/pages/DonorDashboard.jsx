import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { getAlerts } from '../store/slices/alertSlice'
import { getProfile } from '../store/slices/userSlice'
import { formatDistanceToNow } from 'date-fns'
import { FaBell, FaExclamationTriangle, FaMapMarkerAlt, FaTint } from 'react-icons/fa'

const DonorDashboard = () => {
  const dispatch = useDispatch()
  const { alerts, loading } = useSelector((state) => state.alerts)
  const { profile } = useSelector((state) => state.user)

  useEffect(() => {
    dispatch(getAlerts({ status: 'active' }))
    dispatch(getProfile())
  }, [dispatch])

  const myBloodType = profile?.donorProfile?.bloodType
  const relevantAlerts = alerts.filter(
    (alert) => alert.bloodType === myBloodType && alert.status === 'active'
  )

  return (
    <div>
      <div className="dashboard-header">
        <h1>Welcome, {profile?.donorProfile?.firstName || 'Donor'}!</h1>
        <p>Your blood type: <strong>{myBloodType}</strong></p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <FaBell className="stat-icon" />
          <div>
            <h3>{relevantAlerts.length}</h3>
            <p>Active Alerts</p>
          </div>
        </div>
        <div className="stat-card">
          <FaTint className="stat-icon" />
          <div>
            <h3>{myBloodType || 'N/A'}</h3>
            <p>Blood Type</p>
          </div>
        </div>
        <div className="stat-card">
          <FaExclamationTriangle className="stat-icon" />
          <div>
            <h3>Ready</h3>
            <p>{profile?.donorProfile?.isAvailable ? 'Available' : 'Unavailable'}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Active Alerts Matching Your Blood Type</h2>
          <Link to="/emergencies/report" className="btn btn-danger">
            <FaExclamationTriangle /> Report Emergency
          </Link>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : relevantAlerts.length === 0 ? (
          <p className="text-center">No active alerts matching your blood type at the moment.</p>
        ) : (
          <div className="alerts-list">
            {relevantAlerts.map((alert) => (
              <div key={alert._id} className="alert-item">
                <div className="alert-header">
                  <div>
                    <h3>
                      <FaTint /> Blood Type: {alert.bloodType}
                    </h3>
                    <p className="text-secondary">
                      <FaMapMarkerAlt /> {alert.location?.address || 'Location not specified'}
                    </p>
                  </div>
                  <span className={`badge badge-${alert.urgency === 'critical' ? 'danger' : 'warning'}`}>
                    {alert.urgency}
                  </span>
                </div>
                <p>{alert.description || 'No description provided'}</p>
                <div className="alert-footer">
                  <span className="text-secondary">
                    {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                  </span>
                  <Link to={`/alerts/${alert._id}`} className="btn btn-primary btn-sm">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .dashboard-header {
          margin-bottom: 1.5rem;
        }
        .dashboard-header h1 {
          color: var(--text);
          margin-bottom: 0.25rem;
        }
        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .stat-card {
          background: white;
          padding: 1.25rem;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .stat-icon {
          font-size: 1.5rem;
          color: var(--primary);
        }
        .stat-card h3 {
          font-size: 1.5rem;
          color: var(--text);
          margin-bottom: 0;
        }
        .stat-card p {
          color: var(--text-secondary);
          font-size: 0.8rem;
        }
        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .alert-item {
          padding: 1rem;
          border: 1px solid var(--border);
          border-radius: 6px;
        }
        .alert-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }
        .alert-header h3 {
          color: var(--text);
          margin-bottom: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 1rem;
        }
        .alert-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border);
        }
        .btn-sm {
          padding: 0.375rem 0.75rem;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  )
}

export default DonorDashboard
