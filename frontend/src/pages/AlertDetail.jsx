import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getAlertById, expandRadius, respondToAlert, fulfillAlert } from '../store/slices/alertSlice'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'react-toastify'
import { FaArrowLeft, FaTint, FaMapMarkerAlt, FaUsers, FaCheckCircle } from 'react-icons/fa'

const AlertDetail = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { currentAlert, loading } = useSelector((state) => state.alerts)
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    dispatch(getAlertById(id))
  }, [dispatch, id])

  const handleExpandRadius = async () => {
    const result = await dispatch(expandRadius(id))
    if (!result.error) {
      toast.success('Radius expanded. Searching for more donors...')
    }
  }

  const handleRespond = async (response) => {
    const result = await dispatch(respondToAlert({ id, response }))
    if (!result.error) {
      toast.success(`Response recorded: ${response}`)
    }
  }

  const handleFulfill = async () => {
    const result = await dispatch(fulfillAlert({ id, data: {} }))
    if (!result.error) {
      toast.success('Alert marked as fulfilled')
      navigate('/alerts')
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!currentAlert) {
    return <div>Alert not found</div>
  }

  const isInstitution = user?.role === 'institution'
  const isDonor = user?.role === 'donor'
  const isMyAlert = currentAlert.institutionId?._id === user?.id
  const myResponse = currentAlert.matchedDonors?.find(
    (m) => m.donorId?._id === user?.id
  )

  return (
    <div>
      <button onClick={() => navigate(-1)} className="btn btn-outline mb-3">
        <FaArrowLeft /> Back
      </button>

      <div className="card">
        <div className="card-header">
          <div>
            <h1>
              <FaTint /> Blood Type: {currentAlert.bloodType}
            </h1>
            <p className="text-secondary">
              <FaMapMarkerAlt /> {currentAlert.location?.address || 'Location not specified'}
            </p>
          </div>
          <span className={`badge badge-${currentAlert.urgency === 'critical' ? 'danger' : 'warning'}`}>
            {currentAlert.urgency}
          </span>
        </div>

        <div className="alert-details">
          <div className="detail-row">
            <strong>Quantity Required:</strong> {currentAlert.quantity} units
          </div>
          <div className="detail-row">
            <strong>Status:</strong>{' '}
            <span className={`badge badge-${currentAlert.status === 'active' ? 'success' : 'info'}`}>
              {currentAlert.status}
            </span>
          </div>
          <div className="detail-row">
            <strong>Current Radius:</strong> {currentAlert.currentRadius / 1000} KM
          </div>
          <div className="detail-row">
            <strong>Age Requirement:</strong> {currentAlert.ageRequirement?.min} - {currentAlert.ageRequirement?.max} years
          </div>
          {currentAlert.description && (
            <div className="detail-row">
              <strong>Description:</strong>
              <p>{currentAlert.description}</p>
            </div>
          )}
          <div className="detail-row">
            <strong>Created:</strong> {formatDistanceToNow(new Date(currentAlert.createdAt), { addSuffix: true })}
          </div>
        </div>

        {isInstitution && isMyAlert && currentAlert.status === 'active' && (
          <div className="alert-actions">
            {currentAlert.currentRadius < currentAlert.maxRadius && (
              <button onClick={handleExpandRadius} className="btn btn-secondary">
                Expand Search Radius (+500m)
              </button>
            )}
            <button onClick={handleFulfill} className="btn btn-success">
              <FaCheckCircle /> Mark as Fulfilled
            </button>
          </div>
        )}

        {isDonor && myResponse && (
          <div className="alert-actions">
            {myResponse.status === 'pending' && (
              <>
                <button
                  onClick={() => handleRespond('accepted')}
                  className="btn btn-success"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleRespond('rejected')}
                  className="btn btn-outline"
                >
                  Decline
                </button>
              </>
            )}
            {myResponse.status !== 'pending' && (
              <p className="text-success">
                You have {myResponse.status} this alert
              </p>
            )}
          </div>
        )}

        {currentAlert.matchedDonors && currentAlert.matchedDonors.length > 0 && (
          <div className="matched-donors">
            <h3>
              <FaUsers /> Matched Donors ({currentAlert.matchedDonors.length})
            </h3>
            <div className="donors-list">
              {currentAlert.matchedDonors.map((match, index) => (
                <div key={index} className="donor-item">
                  <div>
                    <strong>Blood Type:</strong> {match.donorId?.donorProfile?.bloodType || 'N/A'}
                  </div>
                  <div>
                    <strong>Age:</strong> {match.donorId?.donorProfile?.age || 'N/A'}
                  </div>
                  <div>
                    <strong>Distance:</strong> {(match.distance / 1000).toFixed(2)} KM
                  </div>
                  <div>
                    <strong>Status:</strong>{' '}
                    <span className={`badge badge-${match.status === 'accepted' ? 'success' : match.status === 'rejected' ? 'danger' : 'warning'}`}>
                      {match.status}
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

export default AlertDetail
