import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { reportEmergency } from '../store/slices/emergencySlice'
import { toast } from 'react-toastify'
import { FaArrowLeft, FaMapMarkerAlt } from 'react-icons/fa'

const ReportEmergency = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector((state) => state.emergencies)

  const [formData, setFormData] = useState({
    bloodType: '',
    quantity: 1,
    urgency: 'critical',
    description: '',
    location: {
      address: '',
      coordinates: null,
    },
  })

  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            location: {
              ...prev.location,
              coordinates: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              },
            },
          }))
        },
        (error) => {
          console.error('Geolocation error:', error)
          toast.warning('Could not get your location. Please enter address manually.')
        }
      )
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'quantity') {
      setFormData({
        ...formData,
        [name]: parseInt(value),
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.location.coordinates && !formData.location.address) {
      toast.error('Please provide location information')
      return
    }

    const result = await dispatch(reportEmergency(formData))
    if (!result.error) {
      toast.success('Emergency reported! Nearby institutions have been notified.')
      navigate('/emergencies')
    }
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className="btn btn-outline mb-3">
        <FaArrowLeft /> Back
      </button>

      <div className="card">
        <div className="card-header">
          <h1>Report Road Emergency</h1>
          <p className="text-secondary">
            Report an emergency situation requiring immediate blood donation
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Blood Type Required *</label>
            <select
              name="bloodType"
              className="form-select"
              value={formData.bloodType}
              onChange={handleChange}
              required
            >
              <option value="">Select blood type</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Quantity (units) *</label>
            <input
              type="number"
              name="quantity"
              className="form-input"
              value={formData.quantity}
              onChange={handleChange}
              min={1}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Urgency Level *</label>
            <select
              name="urgency"
              className="form-select"
              value={formData.urgency}
              onChange={handleChange}
              required
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              name="description"
              className="form-input"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe the emergency situation (e.g., road accident, location details)..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <FaMapMarkerAlt /> Location Address *
            </label>
            <input
              type="text"
              className="form-input"
              value={formData.location.address}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  location: { ...formData.location, address: e.target.value },
                })
              }
              placeholder="Enter the emergency location address"
              required
            />
            <small className="text-secondary">
              Your current location will be used if available, but please verify the address
            </small>
          </div>

          {formData.location.coordinates && (
            <div className="alert-info">
              <p>
                <strong>Location detected:</strong> Latitude: {formData.location.coordinates.latitude.toFixed(6)},
                Longitude: {formData.location.coordinates.longitude.toFixed(6)}
              </p>
            </div>
          )}

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-danger" disabled={loading}>
              {loading ? 'Reporting...' : 'Report Emergency'}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .alert-info {
          padding: 0.75rem;
          background: #eff6ff;
          border: 1px solid #dbeafe;
          border-radius: 6px;
          margin-top: 0.75rem;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  )
}

export default ReportEmergency
