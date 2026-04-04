import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { createAlert } from '../store/slices/alertSlice'
import { getProfile } from '../store/slices/userSlice'
import { toast } from 'react-toastify'
import { FaArrowLeft } from 'react-icons/fa'

const CreateAlert = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { profile } = useSelector((state) => state.user)
  const { loading, error } = useSelector((state) => state.alerts)

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

    if (!formData.location.coordinates && !formData.location.address) {
      toast.error('Please provide location information')
      return
    }

    const submitData = {
      ...formData,
      location: formData.location.coordinates
        ? formData.location
        : { address: formData.location.address },
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
                  location: { ...formData.location, address: e.target.value },
                })
              }
              placeholder="Address (will use institution address if left empty)"
            />
            <small className="text-secondary">
              Leave empty to use your institution&apos;s registered address
            </small>
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
