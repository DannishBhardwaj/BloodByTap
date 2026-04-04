import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { userAPI } from '../../services/api'

export const getProfile = createAsyncThunk(
  'user/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAPI.getProfile()
      return response.data.user
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get profile')
    }
  }
)

export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (data, { rejectWithValue }) => {
    try {
      const response = await userAPI.updateProfile(data)
      return response.data.user
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile')
    }
  }
)

export const updateAvailability = createAsyncThunk(
  'user/updateAvailability',
  async (isAvailable, { rejectWithValue }) => {
    try {
      await userAPI.updateAvailability(isAvailable)
      return isAvailable
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update availability')
    }
  }
)

export const getNearbyDonors = createAsyncThunk(
  'user/getNearbyDonors',
  async (params, { rejectWithValue }) => {
    try {
      const response = await userAPI.getNearbyDonors(params)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get nearby donors')
    }
  }
)

const initialState = {
  profile: null,
  nearbyDonors: [],
  loading: false,
  error: null,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false
        state.profile = action.payload
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false
        state.profile = action.payload
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(updateAvailability.fulfilled, (state, action) => {
        if (state.profile && state.profile.donorProfile) {
          state.profile.donorProfile.isAvailable = action.payload
        }
      })
      .addCase(getNearbyDonors.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getNearbyDonors.fulfilled, (state, action) => {
        state.loading = false
        state.nearbyDonors = action.payload.donors || []
      })
      .addCase(getNearbyDonors.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError } = userSlice.actions
export default userSlice.reducer
