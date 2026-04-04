import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { alertAPI } from '../../services/api'

export const createAlert = createAsyncThunk(
  'alerts/createAlert',
  async (data, { rejectWithValue }) => {
    try {
      const response = await alertAPI.createAlert(data)
      return response.data.alert
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create alert')
    }
  }
)

export const getAlerts = createAsyncThunk(
  'alerts/getAlerts',
  async (params, { rejectWithValue }) => {
    try {
      const response = await alertAPI.getAlerts(params)
      return response.data.alerts
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get alerts')
    }
  }
)

export const getAlertById = createAsyncThunk(
  'alerts/getAlertById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await alertAPI.getAlertById(id)
      return response.data.alert
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get alert')
    }
  }
)

export const expandRadius = createAsyncThunk(
  'alerts/expandRadius',
  async (id, { rejectWithValue }) => {
    try {
      const response = await alertAPI.expandRadius(id)
      return response.data.alert
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to expand radius')
    }
  }
)

export const respondToAlert = createAsyncThunk(
  'alerts/respondToAlert',
  async ({ id, response }, { rejectWithValue }) => {
    try {
      const result = await alertAPI.respondToAlert(id, response)
      return { id, alert: result.data.alert }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to respond to alert')
    }
  }
)

export const fulfillAlert = createAsyncThunk(
  'alerts/fulfillAlert',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const result = await alertAPI.fulfillAlert(id, data)
      return { id, alert: result.data.alert }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fulfill alert')
    }
  }
)

const initialState = {
  alerts: [],
  currentAlert: null,
  loading: false,
  error: null,
}

const alertSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentAlert: (state) => {
      state.currentAlert = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createAlert.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createAlert.fulfilled, (state, action) => {
        state.loading = false
        state.alerts.unshift(action.payload)
      })
      .addCase(createAlert.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(getAlerts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getAlerts.fulfilled, (state, action) => {
        state.loading = false
        state.alerts = action.payload
      })
      .addCase(getAlerts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(getAlertById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getAlertById.fulfilled, (state, action) => {
        state.loading = false
        state.currentAlert = action.payload
      })
      .addCase(getAlertById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(expandRadius.fulfilled, (state, action) => {
        const index = state.alerts.findIndex(a => a._id === action.payload._id)
        if (index !== -1) {
          state.alerts[index] = action.payload
        }
        if (state.currentAlert && state.currentAlert._id === action.payload._id) {
          state.currentAlert = action.payload
        }
      })
      .addCase(respondToAlert.fulfilled, (state, action) => {
        const index = state.alerts.findIndex(a => a._id === action.payload.id)
        if (index !== -1) {
          state.alerts[index] = action.payload.alert
        }
        if (state.currentAlert && state.currentAlert._id === action.payload.id) {
          state.currentAlert = action.payload.alert
        }
      })
      .addCase(fulfillAlert.fulfilled, (state, action) => {
        const index = state.alerts.findIndex(a => a._id === action.payload.id)
        if (index !== -1) {
          state.alerts[index] = action.payload.alert
        }
        if (state.currentAlert && state.currentAlert._id === action.payload.id) {
          state.currentAlert = action.payload.alert
        }
      })
  },
})

export const { clearError, clearCurrentAlert } = alertSlice.actions
export default alertSlice.reducer
