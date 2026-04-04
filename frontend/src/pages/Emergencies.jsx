import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { getEmergencies } from '../store/slices/emergencySlice'
import { formatDistanceToNow } from 'date-fns'
import { FaTint, FaMapMarkerAlt, FaExclamationTriangle } from 'react-icons/fa'

const Emergencies = () => {
  const dispatch = useDispatch()
  const { emergencies, loading } = useSelector((state) => state.emergencies)
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    if (user?.role === 'institution') {
      dispatch(getEmergencies({ status: 'pending' }))
    } else {
      dispatch(getEmergencies({ reportedBy: user?.id }))
    }
  }, [dispatch, user])

  return (
    <div>
      <div className="page-header">
        <h1>Emergencies</h1>
        {user?.role === 'donor' && (
          <Link to="/emergencies/report" className="btn btn-danger">
            <FaExclamationTriangle /> Report Emergency
          </Link>
        )}
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : emergencies.length === 0 ? (
        <div className="card">
          <p className="text-center">No emergencies found.</p>
        </div>
      ) : (
        <div className="alerts-list">
          {emergencies.map((emergency) => (
            <div key={emergency._id} className="card alert-card">
              <div className="alert-header">
                <div>
                  <h3>
                    <FaTint /> {emergency.bloodType} - {emergency.quantity} units
                  </h3>
                  <p className="text-secondary">
                    <FaMapMarkerAlt /> {emergency.location?.address || 'Location not specified'}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <span className="badge badge-danger">Critical</span>
                  <span className={`badge badge-${emergency.status === 'pending' ? 'warning' : 'success'}`}>
                    {emergency.status}
                  </span>
                </div>
              </div>
              {emergency.description && <p>{emergency.description}</p>}
              <div className="alert-footer">
                <span className="text-secondary">
                  {formatDistanceToNow(new Date(emergency.createdAt), { addSuffix: true })}
                </span>
                <Link to={`/emergencies/${emergency._id}`} className="btn btn-danger btn-sm">
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

export default Emergencies
