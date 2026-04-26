import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { Toast, useToast } from '../components/Toast'
import { API } from '../utils/helpers'

const SPECIALIZATIONS = [
  'General Medicine', 'Cardiology', 'Neurology', 'Orthopedics',
  'Pediatrics', 'Dermatology', 'Ophthalmology', 'ENT',
  'Psychiatry', 'Gynecology', 'Orthopedic Surgery', 'Urology',
]

const INITIAL = {
  name: '', mobile: '', specialization: '',
  address: '', aadhaar: '', licenseNumber: '',
  experience: '', currentInstitute: '', totalPatients: '',
  consultationCharge: '', email: '', password: '', confirmPassword: '',
  qualification: '',
  profilePhoto: null, regCertificate: null,
}

export default function DoctorProfileForm() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const showToast = useToast()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const setFile = (k) => (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file size (5MB for images, 10MB for PDFs)
      const maxSize = k === 'regCertificate' ? 10 * 1024 * 1024 : 5 * 1024 * 1024
      if (file.size > maxSize) {
        showToast(`File too large! Maximum ${maxSize / (1024 * 1024)}MB`, 'error')
        return
      }
      
      // Validate file type
      const validTypes = k === 'regCertificate' 
        ? ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
        : ['image/jpeg', 'image/png', 'image/jpg']
      
      if (!validTypes.includes(file.type)) {
        showToast(`Invalid file type! Please upload ${validTypes.join(', ')}`, 'error')
        return
      }
      
      setForm(f => ({ ...f, [k]: file }))
    }
  }

  const next = () => {
    if (step === 1 && (!form.name || !form.mobile || !form.email || !form.specialization)) {
      showToast('Please fill all required fields', 'error'); return
    }
    if (step === 2 && (!form.address || !form.aadhaar || !form.licenseNumber)) {
      showToast('Please fill all required fields', 'error'); return
    }
    if (step === 3 && (!form.experience || !form.currentInstitute || !form.qualification)) {
      showToast('Please fill all required fields', 'error'); return
    }
    setStep(s => s + 1)
  }
  
  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) return resolve(null)
      
      // For PDF files, we still convert to base64 but note that localStorage has size limits
      const reader = new FileReader()
      reader.readAsDataURL(file)
      
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const doctorId = 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)

      // Convert files to base64
      const profilePhotoData = await readFileAsBase64(form.profilePhoto)
      const regCertificateData = await readFileAsBase64(form.regCertificate)

      const doctorData = {
        id: doctorId,
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        specialization: form.specialization,
        experience: form.experience,
        qualification: form.qualification,
        regNumber: form.licenseNumber,
        address: form.address,
        aadhaar: form.aadhaar,
        currentInstitute: form.currentInstitute,
        isApproved: false,
        profileComplete: true,
        createdAt: new Date().toISOString(),
        profilePhoto: profilePhotoData,
        regCertificate: regCertificateData
      }

      localStorage.setItem('doctor-profile-complete', 'true')
      localStorage.setItem('doctor-approved', 'false')
      localStorage.setItem('doctor-data', JSON.stringify(doctorData))

      const currentUser = localStorage.getItem('curelex-current-user')
      if (currentUser) {
        const user = JSON.parse(currentUser)
        user.name = form.name
        user.email = form.email
        user.specialization = form.specialization
        localStorage.setItem('curelex-current-user', JSON.stringify(user))
      }

      showToast('Profile submitted successfully!', 'success')
      setStep(4)

    } catch (error) {
      console.error(error)
      showToast('Error saving profile. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleGoToDashboard = () => {
    navigate('/doctor-dashboard')
  }

  const stepLabels = ['Basic Info', 'Documents', 'Experience']

  return (
    <>
      <div style={{ background: 'var(--bg-primary)' }}></div>
      <section className="auth-page-container">
        <div className="auth-page-left">
          <div className="auth-page-content">
            <h1>Join CURELEX</h1>
            <p>Become part of our network of medical professionals serving thousands of patients</p>
            <div className="auth-benefits">
              {[
                ['users', 'Connect with Thousands of Patients'],
                ['video', 'Conduct Video Consultations'],
                ['chart-line', 'Grow Your Practice'],
                ['shield-alt', 'Secure Platform'],
              ].map(([icon, label]) => (
                <div className="benefit-item" key={label}>
                  <i className={`fas fa-${icon}`}></i>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="auth-page-right">
          <div className="auth-page-card multi-step-card">
            <div className="multi-step-header">
              <h2>Doctor Registration</h2>
              <div className="step-indicator">
                {stepLabels.map((label, i) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                    <div className={`step ${step >= i + 1 ? 'active' : ''}`} data-step={i + 1}>
                      <span>{i + 1}</span>
                      <p style={{textWrap:'nowrap'}} >{label}</p>
                    </div>
                    {i < stepLabels.length - 1 && <div className="step-line"></div>}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Step 1 */}
              {step === 1 && (
                <div className="multi-step-content">
                  <div className="step-page active">
                    <h3>Step 1: Basic Information</h3>
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input type="text" placeholder="Enter your full name" value={form.name} onChange={set('name')} required />
                    </div>
                    <div className="form-group">
                      <label>Mobile Number *</label>
                      <input type="tel" placeholder="Enter your mobile number" value={form.mobile}
                        onChange={set('mobile')} pattern="[0-9]{10}" maxLength={10} required />
                    </div>
                    <div className="form-group">
                      <label>Email Address *</label>
                      <input type="email" placeholder="Enter your email" value={form.email}
                        onChange={set('email')} required />
                    </div>
                    <div className="form-group">
                      <label>Specialization *</label>
                      <select value={form.specialization} onChange={set('specialization')} required>
                        <option value="">Select specialization</option>
                        {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <p className="step-note">Your account will be verified after submission</p>
                  </div>
                </div>
              )}

      {/* Step 2 - Simple working file upload */}
{step === 2 && (
  <div className="multi-step-content">
    <div className="step-page active">
      <h3>Step 2: Professional Documents</h3>
      <div className="form-group">
        <label>Address *</label>
        <input type="text" placeholder="Enter your address" value={form.address} onChange={set('address')} required />
      </div>
      <div className="form-group">
        <label>Aadhaar Number *</label>
        <input type="text" placeholder="Enter 12-digit Aadhaar" value={form.aadhaar}
          onChange={set('aadhaar')} pattern="[0-9]{12}" maxLength={12} required />
      </div>
      
      <div className="form-group">
        <label>Professional Photo *</label>
        <input 
          type="file" 
          accept="image/jpeg,image/png,image/jpg" 
          onChange={setFile('profilePhoto')}
          className="form-control"
          style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
        />
        {form.profilePhoto && (
          <div style={{ marginTop: '10px' }}>
            <small>Selected: {form.profilePhoto.name}</small>
            <img 
              src={URL.createObjectURL(form.profilePhoto)} 
              alt="Preview" 
              style={{ maxWidth: '100px', maxHeight: '100px', marginTop: '10px', display: 'block' }}
            />
          </div>
        )}
      </div>
      
      <div className="form-group">
        <label>License Number / Registration Number *</label>
        <input type="text" placeholder="Enter license/registration number" value={form.licenseNumber}
          onChange={set('licenseNumber')} required />
      </div>
      
      <div className="form-group">
        <label>Registration Certificate</label>
        <input 
          type="file" 
          accept=".pdf,.jpg,.jpeg,.png" 
          onChange={setFile('regCertificate')}
          className="form-control"
          style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
        />
        {form.regCertificate && (
          <div style={{ marginTop: '10px' }}>
            <small>Selected: {form.regCertificate.name}</small>
          </div>
        )}
      </div>
    </div>
  </div>
)}

              {/* Step 3 */}
              {step === 3 && (
                <div className="multi-step-content">
                  <div className="step-page active">
                    <h3>Step 3: Professional Experience</h3>
                    <div className="form-group">
                      <label>Years of Experience *</label>
                      <input type="number" placeholder="Enter years of experience" value={form.experience}
                        onChange={set('experience')} min={0} max={50} required />
                    </div>
                    <div className="form-group">
                      <label>Current Practice Institute *</label>
                      <input type="text" placeholder="Enter hospital/clinic name" value={form.currentInstitute}
                        onChange={set('currentInstitute')} required />
                    </div>
                    <div className="form-group">
                      <label>Qualification (e.g., MBBS, MD) *</label>
                      <input type="text" placeholder="Enter your qualification" value={form.qualification}
                        onChange={set('qualification')} required />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4 — Success */}
              {step === 4 && (
                <div className="multi-step-content">
                  <div className="step-page active" style={{ textAlign: 'center' }}>
                    <div className="success-message">
                      <i className="fas fa-check-circle"></i>
                      <h3>Profile Submitted Successfully!</h3>
                      <p>Your profile has been saved and is pending admin approval.</p>
                      <div className="success-details">
                        <p>You will be able to access the dashboard once your profile is approved by the admin.</p>
                        <p><strong>Typical verification time: 24-48 hours</strong></p>
                      </div>
                      <button 
                        className="btn btn-primary" 
                        onClick={handleGoToDashboard}
                        style={{ marginTop: '1.5rem' }}
                      >
                        <i className="fas fa-arrow-right"></i> Go to Dashboard
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {step < 4 && (
                <div className="multi-step-controls">
                  {step > 1 && (
                    <button type="button" className="btn btn-secondary" onClick={() => setStep(s => s - 1)}>
                      <i className="fas fa-arrow-left"></i> Previous
                    </button>
                  )}
                  {step < 3 && (
                    <button type="button" className="btn btn-primary" onClick={next}>
                      Next <i className="fas fa-arrow-right"></i>
                    </button>
                  )}
                  {step === 3 && (
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      <i className="fas fa-check"></i> {loading ? 'Submitting...' : 'Submit Application'}
                    </button>
                  )}
                </div>
              )}
            </form>

            {step < 4 && (
              <p className="auth-switch">
                Want to Go Back? <Link to="/doctor-dashboard">Dashboard</Link>
              </p>
            )}
          </div>
        </div>
      </section>
      <Toast />
    </>
  )
}