import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { createAlert } from '../store/slices/alertSlice'
import { getProfile } from '../store/slices/userSlice'
import { toast } from 'react-toastify'
import { FaArrowLeft, FaMapMarkerAlt } from 'react-icons/fa'

const CreateAlert = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { profile } = useSelector((state) => state.user)
  const { loading, error } = useSelector((state) => state.alerts)
  const [locationLoading, setLocationLoading] = useState(false)

  const [formData, setFormData] = useState({
    bloodType: '',
    quantity: 1,
    urgency: 'high',
    description: '',
    ageRequirement: {
      min: 18,
      max: 65,
    },
    location: {
      address: '',
      coordinates: null,
    },
  })

  useEffect(() => {
    dispatch(getProfile())
  }, [dispatch])

  const detectCurrentLocation = (silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) {
        toast.error('Geolocation is not supported by your browser')
      }
      return
    }

    setLocationLoading(true)
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

        setLocationLoading(false)
        if (!silent) {
          toast.success('Current location captured')
        }
      },
      () => {
        setLocationLoading(false)
        if (!silent) {
          toast.warning('Could not detect current location. You can still continue using address fallback.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000,
      }
    )
  }

  useEffect(() => {
    detectCurrentLocation(true)
  }, [])

  useEffect(() => {
    if (profile?.institutionProfile?.address) {
      setFormData((prev) => ({
        ...prev,
        location: {
          address: [
            profile.institutionProfile.address.street,
            profile.institutionProfile.address.city,
            profile.institutionProfile.address.state,
          ]
            .filter(Boolean)
            .join(', '),
          coordinates: profile.institutionProfile.address.coordinates,
        },
      }))
    }
  }, [profile])

  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name.startsWith('ageRequirement.')) {
      const field = name.split('.')[1]
      setFormData({
        ...formData,
        ageRequirement: {
          ...formData.ageRequirement,
          [field]: parseInt(value),
        },
      })
    } else if (name === 'quantity') {
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

    const institutionAddress = profile?.institutionProfile?.address
    const fallbackLocation = {
      address: [
        institutionAddress?.street,
        institutionAddress?.city,
        institutionAddress?.state,
      ]
        .filter(Boolean)
        .join(', '),
      coordinates: institutionAddress?.coordinates || null,
    }

    const effectiveLocation = formData.location.coordinates
      ? formData.location
      : (formData.location.address?.trim() ? formData.location : fallbackLocation)

    if (!effectiveLocation.coordinates && !effectiveLocation.address) {
      toast.error('Please provide location information')
      return
    }

    const submitData = {
      ...formData,
      location: effectiveLocation.coordinates
        ? effectiveLocation
        : { address: effectiveLocation.address },
    }

    const result = await dispatch(createAlert(submitData))
    if (!result.error) {
      toast.success('Alert created successfully!')
      navigate('/alerts')
    }
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className="btn btn-outline mb-3">
        <FaArrowLeft /> Back
      </button>

      <div className="card">
        <div className="card-header">
          <h1>Create New Alert</h1>
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
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-input"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe the emergency situation..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Location</label>
            <input
              type="text"
              className="form-input"
              value={formData.location.address}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  location: {
                    ...formData.location,
                    address: e.target.value,
                    // Clear inherited coordinates when address is manually edited.
                    coordinates: null,
                  },
                })
              }
              placeholder="Optional address fallback (GPS coordinates are preferred)"
            />
            <small className="text-secondary">
              GPS location is preferred for emergency speed. Address is optional fallback.
            </small>

            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => detectCurrentLocation(false)}
                disabled={locationLoading || loading}
              >
                <FaMapMarkerAlt /> {locationLoading ? 'Detecting...' : 'Use Current Location'}
              </button>

              {formData.location.coordinates && (
                <span className="text-secondary" style={{ fontSize: '0.8rem' }}>
                  Location ready: {formData.location.coordinates.latitude.toFixed(5)}, {formData.location.coordinates.longitude.toFixed(5)}
                </span>
              )}
            </div>
          </div>

          <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Age Requirements</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Minimum Age</label>
              <input
                type="number"
                name="ageRequirement.min"
                className="form-input"
                value={formData.ageRequirement.min}
                onChange={handleChange}
                min={18}
                max={65}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Maximum Age</label>
              <input
                type="number"
                name="ageRequirement.max"
                className="form-input"
                value={formData.ageRequirement.max}
                onChange={handleChange}
                min={18}
                max={65}
              />
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Alert'}
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
    </div>
  )
}

export default CreateAlert
