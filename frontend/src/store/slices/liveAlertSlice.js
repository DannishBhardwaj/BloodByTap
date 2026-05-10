import { createSlice } from '@reduxjs/toolkit'

const MAX_ALERT_ITEMS = 20

const initialState = {
  items: [],
}

const liveAlertSlice = createSlice({
  name: 'liveAlerts',
  initialState,
  reducers: {
    pushLiveAlert: (state, action) => {
      state.items.unshift({
        ...action.payload,
        receivedAt: new Date().toISOString(),
      })

      if (state.items.length > MAX_ALERT_ITEMS) {
        state.items = state.items.slice(0, MAX_ALERT_ITEMS)
      }
    },
    clearLiveAlerts: (state) => {
      state.items = []
    },
    markLiveAlertResponded: (state, action) => {
      const { requestId, response } = action.payload
      const target = state.items.find((item) => item.requestId === requestId)
      if (target) {
        target.response = response
      }
    },
  },
})

export const { pushLiveAlert, clearLiveAlerts, markLiveAlertResponded } = liveAlertSlice.actions
export default liveAlertSlice.reducer
