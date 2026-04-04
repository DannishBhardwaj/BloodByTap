import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import alertReducer from './slices/alertSlice'
import emergencyReducer from './slices/emergencySlice'
import userReducer from './slices/userSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    alerts: alertReducer,
    emergencies: emergencyReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})
