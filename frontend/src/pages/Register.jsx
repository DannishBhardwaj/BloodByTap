import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { register, clearError } from '../store/slices/authSlice'
import { toast } from 'react-toastify'

const Register = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth)

  const [role, setRole] = useState('donor')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    profile: {
      firstName: '',
      lastName: '',
      phone: '',
      bloodType: '',
      age: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
    },
  })

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const handleChange = (e) => {
    const { name, value } = e.target
    
    const topLevel = ['email', 'password', 'confirmPassword', 'role']

    if (topLevel.includes(name)) {
      if (name === 'role') setRole(value)
      setFormData({
        ...formData,
        [name]: value,
      })
      return
    }

    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1]
      setFormData({
        ...formData,
        profile: {
          ...formData.profile,
          address: {
            ...formData.profile.address,
            [addressField]: value,
          },
        },
      })
    } else {
      // Treat remaining fields as part of profile (covers both donor and institution fields)
      setFormData({
        ...formData,
        profile: {
          ...formData.profile,
          [name]: value,
        },
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    // eslint-disable-next-line no-unused-vars
    const { confirmPassword, ...submitData } = formData
    dispatch(register({ ...submitData, role }))
  }

  return (
    <div className="auth-container">
        <div className="auth-card">
        <div className="auth-header">
          <h1>🩸 BloodByTap</h1>
          <h2>Register</h2>
          <p>Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">I am a:</label>
            <select
              name="role"
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="donor">Donor</option>
              <option value="institution">Institution</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              className="form-input"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          {role === 'donor' ? (
            <>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  className="form-input"
                  value={formData.profile.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  className="form-input"
                  value={formData.profile.lastName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  value={formData.profile.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Blood Type</label>
                <select
                  name="bloodType"
                  className="form-select"
                  value={formData.profile.bloodType}
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
                <label className="form-label">Age</label>
                <input
                  type="number"
                  name="age"
                  className="form-input"
                  value={formData.profile.age}
                  onChange={handleChange}
                  required
                  min={18}
                  max={65}
                />
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
                  value={formData.profile.name || ''}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Institution Type</label>
                <select
                  name="type"
                  className="form-select"
                  value={formData.profile.type || ''}
                  onChange={handleChange}
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
                  value={formData.profile.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Person</label>
                <input
                  type="text"
                  name="contactPerson"
                  className="form-input"
                  value={formData.profile.contactPerson || ''}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">License Number</label>
                <input
                  type="text"
                  name="licenseNumber"
                  className="form-input"
                  value={formData.profile.licenseNumber || ''}
                  onChange={handleChange}
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
              value={formData.profile.address.street}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">City</label>
            <input
              type="text"
              name="address.city"
              className="form-input"
              value={formData.profile.address.city}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">State</label>
            <input
              type="text"
              name="address.state"
              className="form-input"
              value={formData.profile.address.state}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Zip Code</label>
            <input
              type="text"
              name="address.zipCode"
              className="form-input"
              value={formData.profile.address.zipCode}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Country</label>
            <input
              type="text"
              name="address.country"
              className="form-input"
              value={formData.profile.address.country}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>

      <style>{`
        .auth-card {
          max-width: 560px;
        }
      `}</style>
    </div>
  )
}

export default Register
