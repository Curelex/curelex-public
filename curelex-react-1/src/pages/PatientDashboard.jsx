import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import DashboardHeader from '../components/DashboardHeader'
import ViewPrescriptionModal from '../components/ViewPrescriptionModal'
import { Toast, useToast } from '../components/Toast'
import { API, authHeaders, formatDate, formatTime } from '../utils/helpers'

export default function PatientDashboard() {
  const { currentUser, token, logout } = useAuth()
  const navigate = useNavigate()
  const showToast = useToast()

  const [stats, setStats] = useState({ upcoming: 0, prescriptions: 0, total: 0, doctors: 0 })
  const [appointments, setAppointments] = useState({ approved: [], pending: [], expired: [] })
  const [prescriptions, setPrescriptions] = useState([])
  const [viewPrescription, setViewPrescription] = useState(null)
  const [appointmentModal, setAppointmentModal] = useState(false)

  useEffect(() => {
    if (!currentUser) { navigate('/'); return }
    loadAppointments()
    loadPrescriptions()
  }, [])

  async function loadAppointments() {
    try {
      const res = await fetch(`${API}/appointments/patient/${currentUser.id}`, { headers: authHeaders(token) })
      const data = await res.json()
      if (!data.success || !data.appointments?.length) return

      const all = data.appointments
      const now = new Date()
      const approved = all.filter(a => a.doctorApproved && new Date(a.appointmentTime) > now && a.status === 'scheduled')
      const pending = all.filter(a => !a.doctorApproved && new Date(a.appointmentTime) > now && a.status === 'scheduled')
      const expired = all.filter(a => !a.doctorApproved && new Date(a.appointmentTime) <= now)
      const uniqueDoctors = [...new Set(all.filter(a => a.doctorApproved).map(a => a.doctorId))].length

      setStats(s => ({ ...s, upcoming: approved.length, total: all.length, doctors: uniqueDoctors }))
      setAppointments({ approved, pending, expired })
    } catch (err) { console.error(err) }
  }

  async function loadPrescriptions() {
    try {
      const res = await fetch(`${API}/prescriptions/patient/${currentUser.id}`, { headers: authHeaders(token) })
      const data = await res.json()
      if (data.success && data.prescriptions?.length) {
        setPrescriptions(data.prescriptions)
        setStats(s => ({ ...s, prescriptions: data.prescriptions.length }))
      }
    } catch (err) { console.error(err) }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const handleAppointmentChoice = (flow) => {
    setAppointmentModal(false)
    if (flow === 'telemedicine') navigate('/telemedicine')
    else {
      const params = new URLSearchParams({ name: currentUser.name, email: currentUser.email })
      window.open(`https://eclinic.example.com/book?${params}`, '_blank')
    }
  }

  const now = new Date()

  return (
    <div className="dashboard-page">
      <DashboardHeader
        backTo="/"
        backLabel="Back to Home"
        rightContent={
          <>
            <span>Welcome, {currentUser?.name}</span>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </>
        }
      />

      <main className="dashboard-main">
        {/* Quick Stats */}
        {/* Quick Stats */}
<div className="quick-stats">
  {[
    { icon: 'fa-calendar-check', num: stats.upcoming, label: 'Upcoming Appointments' },
    { icon: 'fa-prescription-bottle', num: stats.prescriptions, label: 'Prescriptions' },
    { icon: 'fa-file-medical', num: stats.total, label: 'Total Appointments' },
    { icon: 'fa-user-md', num: stats.doctors, label: 'Doctors Consulted' },
  ].map(s => (
    <div className="stat-card" key={s.label}>
      <div className="stat-icon-wrap">
        <i className={`fas ${s.icon}`}></i>
      </div>
      <div className="stat-info">
        <span className="stat-number">{s.num}</span>
        <span className="stat-label">{s.label}</span>
      </div>
    </div>
  ))}
</div>

        <div className="dashboard-grid">
          {/* Symptoms */}
          <div className="dashboard-card">
            <div className="card-header">
              <i className="fas fa-thermometer-half"></i>
              <h3>Current Symptoms</h3>
            </div>
            <div className="card-body">
              <div className="symptom-item">
                <div className="symptom-info">
                  <h4>Fever & Cold</h4>
                  <p>Reported: Jan 15, 2024</p>
                  <span className="badge badge-pending">Under Review</span>
                </div>
              </div>
              <div className="symptom-item">
                <div className="symptom-info">
                  <h4>Headache</h4>
                  <p>Reported: Jan 14, 2024</p>
                  <span className="badge badge-resolved">Resolved</span>
                </div>
              </div>
              <button className="btn btn-primary btn-full">
                <i className="fas fa-plus"></i> Report New Symptom
              </button>
            </div>
          </div>

          {/* Prescriptions */}
          <div className="dashboard-card">
            <div className="card-header">
              <i className="fas fa-prescription-bottle-alt"></i>
              <h3>Past Prescriptions</h3>
            </div>
            <div className="card-body">
              <div className="prescription-list">
                {prescriptions.length === 0 && <p>No prescriptions yet.</p>}
                {prescriptions.map((p, i) => (
                  <div className="prescription-item" key={i}>
                    <div className="prescription-icon"><i className="fas fa-user-md"></i></div>
                    <div className="prescription-info">
                      <h4>{p.doctorName || `Dr. #${p.doctorId || '-'}`}</h4>
                      <p>{p.department || 'General'}</p>
                      <span className="date">{formatDate(p.createdAt)}</span>
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={() => setViewPrescription(p)}>View</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Appointments */}
          <div className="dashboard-card">
            <div className="card-header">
              <i className="fas fa-calendar-alt"></i>
              <h3>Upcoming Appointments</h3>
            </div>
            <div className="card-body">
              {!appointments.approved.length && !appointments.pending.length && (
                <p style={{ color: 'var(--text-secondary)' }}>No upcoming appointments.</p>
              )}
              {appointments.approved.map((apt, i) => {
                const d = new Date(apt.appointmentTime)
                const diffMin = (d - now) / 60000
                const joinAvailable = apt.meetingLink && diffMin <= 30 && diffMin >= -60
                return (
                  <div className="appointment-item" key={i}>
                    <div className="appointment-date">
                      <span className="day">{d.getDate()}</span>
                      <span className="month">{d.toLocaleString('en-US', { month: 'short' })}</span>
                    </div>
                    <div className="appointment-info">
                      <h4>Confirmed Appointment</h4>
                      <p>Dr. #{apt.doctorId} · {formatTime(apt.appointmentTime)}</p>
                      <span className="badge badge-resolved" style={{ marginTop: 4 }}>✅ Approved</span>
                      {joinAvailable ? (
                        <a href={apt.meetingLink} target="_blank" rel="noopener" style={{
                          display: 'flex', alignItems: 'center', gap: 8, marginTop: 10,
                          background: '#22c55e', color: '#fff', padding: '8px 14px',
                          borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 500, width: 'fit-content'
                        }}>
                          <i className="fas fa-video"></i> Join Video Call
                        </a>
                      ) : apt.meetingLink ? (
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
                          Video link ready · available 30 min before appointment
                        </p>
                      ) : null}
                    </div>
                  </div>
                )
              })}
              {appointments.pending.map((apt, i) => {
                const d = new Date(apt.appointmentTime)
                return (
                  <div className="appointment-item" key={`p-${i}`} style={{ opacity: 0.8 }}>
                    <div className="appointment-date">
                      <span className="day">{d.getDate()}</span>
                      <span className="month">{d.toLocaleString('en-US', { month: 'short' })}</span>
                    </div>
                    <div className="appointment-info">
                      <h4>Appointment Request</h4>
                      <p>Doctor #{apt.doctorId} · {formatTime(apt.appointmentTime)}</p>
                      <span className="badge badge-pending" style={{ marginTop: 4 }}>⏳ Awaiting Doctor Approval</span>
                    </div>
                  </div>
                )
              })}
              {appointments.expired.length > 0 && (
                <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 13 }}>
                  <i className="fas fa-exclamation-circle"></i>
                  <strong> {appointments.expired.length} past request{appointments.expired.length > 1 ? 's were' : ' was'} not approved and expired.</strong> Please book a new appointment.
                </div>
              )}
            </div>
            <button className="btn btn-primary btn-full" onClick={() => setAppointmentModal(true)}>
              <i className="fas fa-calendar-plus"></i> Book New Appointment
            </button>
          </div>

          {/* Follow-up History */}
          <div className="dashboard-card">
            <div className="card-header">
              <i className="fas fa-history"></i>
              <h3>Follow-Up History</h3>
            </div>
            <div className="card-body">
              <div className="timeline">
                {[
                  { title: 'Follow-up Complete', date: 'Jan 10, 2024', doctor: 'Dr. Sarah Johnson' },
                  { title: 'Initial Consultation', date: 'Dec 15, 2023', doctor: 'Dr. Amit Patel' },
                  { title: 'Follow-up Complete', date: 'Nov 20, 2023', doctor: 'Dr. Emily Chen' },
                  { title: 'Initial Consultation', date: 'Oct 05, 2023', doctor: 'Dr. Sarah Johnson' },
                ].map((item, i) => (
                  <div className="timeline-item" key={i}>
                    <div className="timeline-dot active"></div>
                    <div className="timeline-content">
                      <h4>{item.title}</h4>
                      <p>{item.date}</p>
                      <span className="doctor-name">{item.doctor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Current Follow-Up Status */}
          <div className="dashboard-card full-width">
            <div className="card-header">
              <i className="fas fa-calendar-check"></i>
              <h3>Current Follow-Up Status</h3>
            </div>
            <div className="card-body">
              <div className="followup-status">
                <div className="status-progress">
                  {['Consulted', 'Prescribed', 'In Treatment', 'Complete'].map((label, i) => (
                    <div className={`progress-step ${i < 3 ? 'active' : ''}`} key={label}>
                      <div className="step-icon">
                        <i className={`fas ${i < 2 ? 'fa-check' : 'fa-circle'}`}></i>
                      </div>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <div className="followup-details">
                  {[
                    { icon: 'fa-user-md', label: 'Doctor', value: 'Dr. Sarah Johnson' },
                    { icon: 'fa-calendar', label: 'Next Visit', value: 'January 25, 2024' },
                    { icon: 'fa-heartbeat', label: 'Status', value: 'Recovery in Progress' },
                    { icon: 'fa-pills', label: 'Medications', value: '3 prescribed' },
                  ].map(d => (
                    <div className="detail-item" key={d.label}>
                      <i className={`fas ${d.icon}`}></i>
                      <div><strong>{d.label}:</strong> {d.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Medical Records */}
          <div className="dashboard-card full-width">
            <div className="card-header">
              <i className="fas fa-folder-open"></i>
              <h3>Medical Records</h3>
            </div>
            <div className="card-body">
              <div className="records-grid">
                {[
                  { icon: 'fa-file-pdf', title: 'Blood Test Report', date: 'Jan 10, 2024' },
                  { icon: 'fa-file-image', title: 'X-Ray Chest', date: 'Dec 20, 2023' },
                  { icon: 'fa-file-alt', title: 'ECG Report', date: 'Nov 15, 2023' },
                  { icon: 'fa-file-medical-alt', title: 'Health Certificate', date: 'Oct 05, 2023' },
                ].map(r => (
                  <div className="record-item" key={r.title}>
                    <i className={`fas ${r.icon}`}></i>
                    <div><h4>{r.title}</h4><p>{r.date}</p></div>
                    <button className="btn btn-outline btn-sm">Download</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Appointment Modal */}
      {appointmentModal && (
        <div className="modal active">
          <div className="modal-overlay" onClick={() => setAppointmentModal(false)}></div>
          <div className="modal-container">
            <button className="modal-close" onClick={() => setAppointmentModal(false)}>&times;</button>
            <div className="appointment-modal-header">
              <i className="fas fa-calendar-plus"></i>
              <h2>Book New Appointment</h2>
              <p>Choose your preferred consultation type</p>
            </div>
            <div className="appointment-options">
              <div className="appointment-option telemedicine-option" onClick={() => handleAppointmentChoice('telemedicine')}>
                <div className="option-icon"><i className="fas fa-video"></i></div>
                <h3>Telemedicine</h3>
                <p>Online video consultation from home. Fast and convenient.</p>
                <button className="btn btn-primary">Continue</button>
              </div>
              <div className="appointment-option eclinic-option" onClick={() => handleAppointmentChoice('eclinic')}>
                <div className="option-icon"><i className="fas fa-clinic-medical"></i></div>
                <h3>E-Clinic</h3>
                <p>Visit partner clinics for in-person consultation.</p>
                <button className="btn btn-primary">Continue</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewPrescription && (
        <ViewPrescriptionModal prescription={viewPrescription} onClose={() => setViewPrescription(null)} />
      )}

      <Toast />
    </div>
  )
}