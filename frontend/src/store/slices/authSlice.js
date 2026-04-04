import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authAPI } from '../../services/api'

// Async thunks
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData)
      const { token, user } = response.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      return { token, user }
    } catch (error) {
      // Normalize backend error shapes (message or validation errors array)
      const resp = error.response?.data
      let message = 'Registration failed'
      if (resp?.message) message = resp.message
      else if (Array.isArray(resp?.errors)) message = resp.errors.map(e => e.msg || e.message).join(', ')
      else if (typeof resp === 'string') message = resp
      return rejectWithValue(message)
    }
  }
)

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials)
      const { token, user } = response.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      return { token, user }
    } catch (error) {
      const resp = error.response?.data
      let message = 'Login failed'
      if (resp?.message) message = resp.message
      else if (Array.isArray(resp?.errors)) message = resp.errors.map(e => e.msg || e.message).join(', ')
      else if (typeof resp === 'string') message = resp
      return rejectWithValue(message)
    }
  }
)

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.getCurrentUser()
      return response.data.user
    } catch (error) {
      const resp = error.response?.data
      let message = 'Failed to get user'
      if (resp?.message) message = resp.message
      else if (Array.isArray(resp?.errors)) message = resp.errors.map(e => e.msg || e.message).join(', ')
      else if (typeof resp === 'string') message = resp
      return rejectWithValue(message)
    }
  }
)

const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error?.message || 'Registration failed'
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error?.message || 'Login failed'
      })
      // Get current user
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false
        const user = action.payload
        state.user = user ? { ...user, id: user.id || user._id } : null
        state.isAuthenticated = true
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false
        state.isAuthenticated = false
        state.user = null
        state.token = null
        state.error = action.payload || action.error?.message || 'Failed to get user'
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
