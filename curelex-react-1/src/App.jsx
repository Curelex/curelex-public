// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Home              from './pages/Home'
import PatientLogin      from './pages/PatientLogin'
import DoctorLogin       from './pages/DoctorLogin'
import DoctorRegister    from './pages/DoctorProfileForm'
import PatientDashboard  from './pages/PatientDashboard'
import DoctorDashboard   from './pages/DoctorDashboard'
import Telemedicine      from './pages/Telemedicine'
import About             from './pages/About'
import AdminDashboard    from './pages/AdminDashboard'

// Optional — only import if file exists
let DoctorProfileForm = null
try {
  DoctorProfileForm = require('./pages/DoctorProfileForm').default
} catch {}

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth()
  return currentUser ? children : <Navigate to="/" replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"               element={<Home />} />
      <Route path="/patient-login"  element={<PatientLogin />} />
      <Route path="/doctor-login"   element={<DoctorLogin />} />
      <Route path="/doctor-register" element={<DoctorRegister />} />
      <Route path="/about"          element={<About />} />
      <Route path="/admin"          element={<AdminDashboard />} />

      {/* Doctor profile form — only if file exists */}
      {DoctorProfileForm && (
        <Route path="/doctor-profile" element={<DoctorProfileForm />} />
      )}

      {/* Protected */}
      <Route
        path="/patient-dashboard"
        element={
          <ProtectedRoute>
            <PatientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor-dashboard"
        element={
          <ProtectedRoute>
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/telemedicine"
        element={
          <ProtectedRoute>
            <Telemedicine />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
