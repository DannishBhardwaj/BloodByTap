import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { emergencyAPI } from '../../services/api'

export const reportEmergency = createAsyncThunk(
  'emergencies/reportEmergency',
  async (data, { rejectWithValue }) => {
    try {
      const response = await emergencyAPI.reportEmergency(data)
      return response.data.emergency
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to report emergency')
    }
  }
)

export const getEmergencies = createAsyncThunk(
  'emergencies/getEmergencies',
  async (params, { rejectWithValue }) => {
    try {
      const response = await emergencyAPI.getEmergencies(params)
      return response.data.emergencies
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get emergencies')
    }
  }
)

export const getEmergencyById = createAsyncThunk(
  'emergencies/getEmergencyById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await emergencyAPI.getEmergencyById(id)
      return response.data.emergency
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get emergency')
    }
  }
)

export const acknowledgeEmergency = createAsyncThunk(
  'emergencies/acknowledgeEmergency',
  async (id, { rejectWithValue }) => {
    try {
      const response = await emergencyAPI.acknowledgeEmergency(id)
      return response.data.emergency
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to acknowledge emergency')
    }
  }
)

export const handleEmergency = createAsyncThunk(
  'emergencies/handleEmergency',
  async (id, { rejectWithValue }) => {
    try {
      const response = await emergencyAPI.handleEmergency(id)
      return response.data.emergency
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to handle emergency')
    }
  }
)

const initialState = {
  emergencies: [],
  currentEmergency: null,
  loading: false,
  error: null,
}

const emergencySlice = createSlice({
  name: 'emergencies',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentEmergency: (state) => {
      state.currentEmergency = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(reportEmergency.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(reportEmergency.fulfilled, (state, action) => {
        state.loading = false
        state.emergencies.unshift(action.payload)
      })
      .addCase(reportEmergency.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(getEmergencies.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getEmergencies.fulfilled, (state, action) => {
        state.loading = false
        state.emergencies = action.payload
      })
      .addCase(getEmergencies.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(getEmergencyById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getEmergencyById.fulfilled, (state, action) => {
        state.loading = false
        state.currentEmergency = action.payload
      })
      .addCase(getEmergencyById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(acknowledgeEmergency.fulfilled, (state, action) => {
        const index = state.emergencies.findIndex(e => e._id === action.payload._id)
        if (index !== -1) {
          state.emergencies[index] = action.payload
        }
        if (state.currentEmergency && state.currentEmergency._id === action.payload._id) {
          state.currentEmergency = action.payload
        }
      })
      .addCase(handleEmergency.fulfilled, (state, action) => {
        const index = state.emergencies.findIndex(e => e._id === action.payload._id)
        if (index !== -1) {
          state.emergencies[index] = action.payload
        }
        if (state.currentEmergency && state.currentEmergency._id === action.payload._id) {
          state.currentEmergency = action.payload
        }
      })
  },
})

export const { clearError, clearCurrentEmergency } = emergencySlice.actions
export default emergencySlice.reducer
