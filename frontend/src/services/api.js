import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
}

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  updateFCMToken: (fcmToken) => api.put('/users/fcm-token', { fcmToken }),
  updateAvailability: (isAvailable) => api.put('/users/availability', { isAvailable }),
  getNearbyDonors: (params) => api.get('/users/donors/nearby', { params }),
}

// Alert API
export const alertAPI = {
  createAlert: (data) => api.post('/alerts', data),
  getAlerts: (params) => api.get('/alerts', { params }),
  getAlertById: (id) => api.get(`/alerts/${id}`),
  expandRadius: (id) => api.post(`/alerts/${id}/expand-radius`),
  respondToAlert: (id, response) => api.post(`/alerts/${id}/respond`, { response }),
  fulfillAlert: (id, data) => api.put(`/alerts/${id}/fulfill`, data),
}

// Emergency API
export const emergencyAPI = {
  reportEmergency: (data) => api.post('/emergencies', data),
  getEmergencies: (params) => api.get('/emergencies', { params }),
  getEmergencyById: (id) => api.get(`/emergencies/${id}`),
  acknowledgeEmergency: (id) => api.post(`/emergencies/${id}/acknowledge`),
  handleEmergency: (id) => api.put(`/emergencies/${id}/handle`),
}

export default api
