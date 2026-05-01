import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { Toast, useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { API } from '../utils/helpers'

export default function PatientLogin() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const showToast  = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // ✅ FIX: was /patients/login — correct route is /users/login
      //         because app.js mounts userRoutes at /api/users
      const res = await fetch(`${API}/users/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (data.token) {
        // data.user = { id, name, email, role } from loginUser controller
        login(data.user, data.token, 'patient')
        showToast('Login successful!', 'success')
        navigate('/patient-dashboard')
      } else {
        showToast(data.message || 'Invalid credentials', 'error')
      }
    } catch {
      showToast('Server error. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div style={{ height: 81, background: 'var(--bg-primary)' }}></div>
      <section className="auth-page-container">
        <div className="auth-page-left">
          <div className="auth-page-content">
            <h1>Patient Login</h1>
            <p>Access your health records and connect with expert doctors</p>
            <div className="auth-benefits">
              {['Book Appointments Easily', 'Video Consultations', 'View Medical Records', 'Manage Prescriptions'].map(b => (
                <div className="benefit-item" key={b}>
                  <i className="fas fa-check-circle"></i>
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="auth-page-right">
          <div className="auth-page-card">
            <div className="auth-header">
              <h2>Welcome Back</h2>
              <p>Sign in to your account</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email ID</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{ width: '100%', paddingRight: 35 }}
                  />
                  <i
                    className={`fa-solid fa-eye${showPw ? '-slash' : ''}`}
                    onClick={() => setShowPw(p => !p)}
                    style={{ position: 'absolute', right: 10, top: 12, cursor: 'pointer' }}
                  />
                </div>
              </div>
              <div className="form-footer">
                <a href="#" className="forgot-link">Forgot Password?</a>
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            <div className="auth-divider"><span>Don't have an account?</span></div>
            <Link to="/" className="btn btn-secondary btn-full">Create Account</Link>
            <p className="auth-switch">
              Are you a doctor? <Link to="/doctor-login">Doctor Login</Link>
            </p>
          </div>
        </div>
      </section>
      <Toast />
    </>
  )
}