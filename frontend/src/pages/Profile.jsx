import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateProfile, updateAvailability, getProfile } from '../store/slices/userSlice'
import { toast } from 'react-toastify'
import { FaEdit, FaCheck, FaTimes } from 'react-icons/fa'

const Profile = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { profile, loading } = useSelector((state) => state.user)

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})

  useEffect(() => {
    dispatch(getProfile())
  }, [dispatch])

  useEffect(() => {
    if (profile) {
      if (user?.role === 'donor') {
        setFormData({
          firstName: profile.donorProfile?.firstName || '',
          lastName: profile.donorProfile?.lastName || '',
          phone: profile.donorProfile?.phone || '',
          bloodType: profile.donorProfile?.bloodType || '',
          age: profile.donorProfile?.age || '',
          healthStatus: profile.donorProfile?.healthStatus || 'good',
          address: profile.donorProfile?.address || {},
        })
      } else {
        setFormData({
          name: profile.institutionProfile?.name || '',
          type: profile.institutionProfile?.type || '',
          phone: profile.institutionProfile?.phone || '',
          contactPerson: profile.institutionProfile?.contactPerson || '',
          licenseNumber: profile.institutionProfile?.licenseNumber || '',
          address: profile.institutionProfile?.address || {},
        })
      }
    }
  }, [profile, user])

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1]
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value,
        },
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
    const result = await dispatch(updateProfile({ profile: formData }))
    if (!result.error) {
      toast.success('Profile updated successfully')
      setIsEditing(false)
    }
  }

  const handleAvailabilityToggle = async () => {
    const newAvailability = !profile?.donorProfile?.isAvailable
    const result = await dispatch(updateAvailability(newAvailability))
    if (!result.error) {
      toast.success(`Availability updated to ${newAvailability ? 'available' : 'unavailable'}`)
    }
  }

  if (loading && !profile) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>Profile</h1>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="btn btn-primary">
            <FaEdit /> Edit Profile
          </button>
        )}
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {user?.role === 'donor' ? (
            <>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  className="form-input"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  className="form-input"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Blood Type</label>
                <select
                  name="bloodType"
                  className="form-select"
                  value={formData.bloodType}
                  onChange={handleChange}
                  disabled={!isEditing}
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
                <label className="form-label">Age</label>
                <input
                  type="number"
                  name="age"
                  className="form-input"
                  value={formData.age}
                  onChange={handleChange}
                  disabled={!isEditing}
                  min={18}
                  max={65}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Health Status</label>
                <select
                  name="healthStatus"
                  className="form-select"
                  value={formData.healthStatus}
                  onChange={handleChange}
                  disabled={!isEditing}
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Availability</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span>{profile?.donorProfile?.isAvailable ? 'Available' : 'Unavailable'}</span>
                  <button
                    type="button"
                    onClick={handleAvailabilityToggle}
                    className={`btn ${profile?.donorProfile?.isAvailable ? 'btn-success' : 'btn-outline'}`}
                  >
                    {profile?.donorProfile?.isAvailable ? 'Set Unavailable' : 'Set Available'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Institution Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Institution Type</label>
                <select
                  name="type"
                  className="form-select"
                  value={formData.type}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                >
                  <option value="">Select type</option>
                  <option value="hospital">Hospital</option>
                  <option value="blood-bank">Blood Bank</option>
                  <option value="clinic">Clinic</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Person</label>
                <input
                  type="text"
                  name="contactPerson"
                  className="form-input"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">License Number</label>
                <input
                  type="text"
                  name="licenseNumber"
                  className="form-input"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </>
          )}

          <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Address</h3>

          <div className="form-group">
            <label className="form-label">Street</label>
            <input
              type="text"
              name="address.street"
              className="form-input"
              value={formData.address?.street || ''}
              onChange={handleChange}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">City</label>
            <input
              type="text"
              name="address.city"
              className="form-input"
              value={formData.address?.city || ''}
              onChange={handleChange}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">State</label>
            <input
              type="text"
              name="address.state"
              className="form-input"
              value={formData.address?.state || ''}
              onChange={handleChange}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Zip Code</label>
            <input
              type="text"
              name="address.zipCode"
              className="form-input"
              value={formData.address?.zipCode || ''}
              onChange={handleChange}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Country</label>
            <input
              type="text"
              name="address.country"
              className="form-input"
              value={formData.address?.country || ''}
              onChange={handleChange}
              disabled={!isEditing}
              required
            />
          </div>

          {isEditing && (
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <FaCheck /> Save Changes
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setIsEditing(false)}
                disabled={loading}
              >
                <FaTimes /> Cancel
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default Profile
