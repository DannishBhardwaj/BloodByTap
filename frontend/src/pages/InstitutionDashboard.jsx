import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { getAlerts } from '../store/slices/alertSlice'
import { getEmergencies } from '../store/slices/emergencySlice'
import { formatDistanceToNow } from 'date-fns'
import { FaBell, FaExclamationTriangle, FaPlus, FaTint, FaMapMarkerAlt } from 'react-icons/fa'

const InstitutionDashboard = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { alerts, loading: alertsLoading } = useSelector((state) => state.alerts)
  const { emergencies, loading: emergenciesLoading } = useSelector((state) => state.emergencies)

  useEffect(() => {
    dispatch(getAlerts({ institutionId: user?.id }))
    dispatch(getEmergencies({ status: 'pending' }))
  }, [dispatch, user])

  const activeAlerts = alerts.filter((a) => a.status === 'active')
  const pendingEmergencies = emergencies.filter((e) => e.status === 'pending')

  return (
    <div>
      <div className="dashboard-header">
        <h1>Welcome, {user?.institutionProfile?.name || 'Institution'}!</h1>
        <p>Manage alerts and respond to emergencies</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <FaBell className="stat-icon" />
          <div>
            <h3>{activeAlerts.length}</h3>
            <p>Active Alerts</p>
          </div>
        </div>
        <div className="stat-card">
          <FaExclamationTriangle className="stat-icon" style={{ color: 'var(--warning-color)' }} />
          <div>
            <h3>{pendingEmergencies.length}</h3>
            <p>Pending Emergencies</p>
          </div>
        </div>
        <div className="stat-card">
          <FaPlus className="stat-icon" style={{ color: 'var(--success-color)' }} />
          <div>
            <h3>Create</h3>
            <p>New Alert</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h2>Your Active Alerts</h2>
            <Link to="/alerts/create" className="btn btn-primary">
              <FaPlus /> Create Alert
            </Link>
          </div>

          {alertsLoading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : activeAlerts.length === 0 ? (
            <p className="text-center">No active alerts. Create one to get started!</p>
          ) : (
            <div className="alerts-list">
              {activeAlerts.map((alert) => (
                <div key={alert._id} className="alert-item">
                  <div className="alert-header">
                    <div>
                      <h3>
                        <FaTint /> {alert.bloodType} - {alert.quantity} units
                      </h3>
                      <p className="text-secondary">
                        <FaMapMarkerAlt /> {alert.location?.address || 'Your location'}
                      </p>
                    </div>
                    <span className={`badge badge-${alert.urgency === 'critical' ? 'danger' : 'warning'}`}>
                      {alert.urgency}
                    </span>
                  </div>
                  <p>{alert.description || 'No description'}</p>
                  <div className="alert-footer">
                    <span className="text-secondary">
                      {alert.matchedDonors?.length || 0} donors notified
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

        <div className="card">
          <div className="card-header">
            <h2>Pending Emergencies</h2>
          </div>

          {emergenciesLoading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : pendingEmergencies.length === 0 ? (
            <p className="text-center">No pending emergencies at the moment.</p>
          ) : (
            <div className="alerts-list">
              {pendingEmergencies.map((emergency) => (
                <div key={emergency._id} className="alert-item">
                  <div className="alert-header">
                    <div>
                      <h3>
                        <FaTint /> {emergency.bloodType} - {emergency.quantity} units
                      </h3>
                      <p className="text-secondary">
                        <FaMapMarkerAlt /> {emergency.location?.address || 'Location not specified'}
                      </p>
                    </div>
                    <span className="badge badge-danger">Critical</span>
                  </div>
                  <p>{emergency.description || 'No description'}</p>
                  <div className="alert-footer">
                    <span className="text-secondary">
                      {formatDistanceToNow(new Date(emergency.createdAt), { addSuffix: true })}
                    </span>
                    <Link to={`/emergencies/${emergency._id}`} className="btn btn-danger btn-sm">
                      Respond
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: 1.5rem;
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
        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default InstitutionDashboard
