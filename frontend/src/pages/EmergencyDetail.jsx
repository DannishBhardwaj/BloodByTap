import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getEmergencyById, acknowledgeEmergency, handleEmergency } from '../store/slices/emergencySlice'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'react-toastify'
import { FaArrowLeft, FaTint, FaMapMarkerAlt, FaCheckCircle, FaHospital } from 'react-icons/fa'

const EmergencyDetail = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { currentEmergency, loading } = useSelector((state) => state.emergencies)
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    dispatch(getEmergencyById(id))
  }, [dispatch, id])

  const handleAcknowledge = async () => {
    const result = await dispatch(acknowledgeEmergency(id))
    if (!result.error) {
      toast.success('Emergency acknowledged successfully')
    }
  }

  const handleComplete = async () => {
    const result = await dispatch(handleEmergency(id))
    if (!result.error) {
      toast.success('Emergency marked as handled')
      navigate('/emergencies')
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!currentEmergency) {
    return <div>Emergency not found</div>
  }

  const isInstitution = user?.role === 'institution'
  const canAcknowledge = isInstitution && currentEmergency.status === 'pending'
  const acknowledgedById = currentEmergency.acknowledgedBy?._id ?? currentEmergency.acknowledgedBy
  const currentUserId = user?.id ?? user?._id
  const canHandle = isInstitution && currentEmergency.status === 'acknowledged' &&
    acknowledgedById && String(acknowledgedById) === String(currentUserId)

  return (
    <div>
      <button onClick={() => navigate(-1)} className="btn btn-outline mb-3">
        <FaArrowLeft /> Back
      </button>

      <div className="card">
        <div className="card-header">
          <div>
            <h1>
              <FaTint /> Blood Type: {currentEmergency.bloodType}
            </h1>
            <p className="text-secondary">
              <FaMapMarkerAlt /> {currentEmergency.location?.address || 'Location not specified'}
            </p>
          </div>
          <span className="badge badge-danger">Critical Emergency</span>
        </div>

        <div className="alert-details">
          <div className="detail-row">
            <strong>Quantity Required:</strong> {currentEmergency.quantity} units
          </div>
          <div className="detail-row">
            <strong>Status:</strong>{' '}
            <span className={`badge badge-${currentEmergency.status === 'pending' ? 'warning' : currentEmergency.status === 'acknowledged' ? 'info' : 'success'}`}>
              {currentEmergency.status}
            </span>
          </div>
          {currentEmergency.description && (
            <div className="detail-row">
              <strong>Description:</strong>
              <p>{currentEmergency.description}</p>
            </div>
          )}
          <div className="detail-row">
            <strong>Reported:</strong> {formatDistanceToNow(new Date(currentEmergency.createdAt), { addSuffix: true })}
          </div>
          {currentEmergency.acknowledgedBy && (
            <div className="detail-row">
              <strong>Acknowledged By:</strong> {currentEmergency.acknowledgedBy?.institutionProfile?.name || 'Institution'}
            </div>
          )}
        </div>

        {canAcknowledge && (
          <div className="alert-actions">
            <button onClick={handleAcknowledge} className="btn btn-primary">
              <FaCheckCircle /> Acknowledge Emergency
            </button>
          </div>
        )}

        {canHandle && (
          <div className="alert-actions">
            <button onClick={handleComplete} className="btn btn-success">
              <FaHospital /> Mark as Handled
            </button>
          </div>
        )}

        {currentEmergency.notifiedInstitutions && currentEmergency.notifiedInstitutions.length > 0 && (
          <div className="matched-donors">
            <h3>
              <FaHospital /> Notified Institutions ({currentEmergency.notifiedInstitutions.length})
            </h3>
            <div className="donors-list">
              {currentEmergency.notifiedInstitutions.map((notif, index) => (
                <div key={index} className="donor-item">
                  <div>
                    <strong>Institution:</strong> {notif.institutionId?.institutionProfile?.name || 'N/A'}
                  </div>
                  <div>
                    <strong>Distance:</strong> {(notif.distance / 1000).toFixed(2)} KM
                  </div>
                  <div>
                    <strong>Status:</strong>{' '}
                    <span className={`badge badge-${notif.status === 'acknowledged' ? 'success' : notif.status === 'rejected' ? 'danger' : 'warning'}`}>
                      {notif.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .alert-details {
          margin: 1rem 0;
        }
        .detail-row {
          margin-bottom: 0.75rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border);
          font-size: 0.9rem;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .alert-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border);
        }
        .matched-donors {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border);
        }
        .donors-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 0.75rem;
          margin-top: 0.75rem;
        }
        .donor-item {
          padding: 0.75rem;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--bg);
          font-size: 0.875rem;
        }
        .donor-item div {
          margin-bottom: 0.375rem;
        }
        @media (max-width: 768px) {
          .alert-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}

export default EmergencyDetail
