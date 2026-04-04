import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { getAlerts } from '../store/slices/alertSlice'
import { formatDistanceToNow } from 'date-fns'
import { FaTint, FaMapMarkerAlt, FaPlus } from 'react-icons/fa'

const Alerts = () => {
  const dispatch = useDispatch()
  const { alerts, loading } = useSelector((state) => state.alerts)
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    if (user?.role === 'institution') {
      dispatch(getAlerts({ institutionId: user.id }))
    } else {
      dispatch(getAlerts({ status: 'active' }))
    }
  }, [dispatch, user])

  return (
    <div>
      <div className="page-header">
        <h1>Alerts</h1>
        {user?.role === 'institution' && (
          <Link to="/alerts/create" className="btn btn-primary">
            <FaPlus /> Create Alert
          </Link>
        )}
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : alerts.length === 0 ? (
        <div className="card">
          <p className="text-center">No alerts found.</p>
        </div>
      ) : (
        <div className="alerts-list">
          {alerts.map((alert) => (
            <div key={alert._id} className="card alert-card">
              <div className="alert-header">
                <div>
                  <h3>
                    <FaTint /> {alert.bloodType} - {alert.quantity} units
                  </h3>
                  <p className="text-secondary">
                    <FaMapMarkerAlt /> {alert.location?.address || 'Location not specified'}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <span className={`badge badge-${alert.urgency === 'critical' ? 'danger' : 'warning'}`}>
                    {alert.urgency}
                  </span>
                  <span className={`badge badge-${alert.status === 'active' ? 'success' : 'info'}`}>
                    {alert.status}
                  </span>
                </div>
              </div>
              {alert.description && <p>{alert.description}</p>}
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

      <style>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .alert-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }
        .alert-header h3 {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          margin-bottom: 0.25rem;
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
      `}</style>
    </div>
  )
}

export default Alerts
