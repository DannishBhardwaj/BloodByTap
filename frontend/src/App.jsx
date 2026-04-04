import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getCurrentUser } from './store/slices/authSlice'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import DonorDashboard from './pages/DonorDashboard'
import InstitutionDashboard from './pages/InstitutionDashboard'
import Alerts from './pages/Alerts'
import AlertDetail from './pages/AlertDetail'
import CreateAlert from './pages/CreateAlert'
import Emergencies from './pages/Emergencies'
import EmergencyDetail from './pages/EmergencyDetail'
import ReportEmergency from './pages/ReportEmergency'
import Profile from './pages/Profile'

function App() {
  const dispatch = useDispatch()
  const { isAuthenticated, token } = useSelector((state) => state.auth)

  useEffect(() => {
    if (token && !isAuthenticated) {
      dispatch(getCurrentUser())
    }
  }, [dispatch, token, isAuthenticated])

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<DashboardRouter />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="alerts/:id" element={<AlertDetail />} />
        <Route path="alerts/create" element={<CreateAlert />} />
        <Route path="emergencies" element={<Emergencies />} />
        <Route path="emergencies/report" element={<ReportEmergency />} />
        <Route path="emergencies/:id" element={<EmergencyDetail />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  )
}

// Router component to redirect based on user role
function DashboardRouter() {
  const { user } = useSelector((state) => state.auth)
  
  if (user?.role === 'donor') {
    return <DonorDashboard />
  } else if (user?.role === 'institution') {
    return <InstitutionDashboard />
  }
  
  return <Navigate to="/login" />
}

export default App
