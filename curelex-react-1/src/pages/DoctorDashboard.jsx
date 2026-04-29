import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Toast, useToast } from '../components/Toast'
import { API, authHeaders, formatDate, formatTime, timeAgoString } from '../utils/helpers'

/* ─── Doctor Nav Items ───────────────────────────────────────── */
const NAV_ITEMS = [
  { icon: 'fa-home',                  label: 'Dashboard',            key: 'home'         },
  { icon: 'fa-calendar-check',        label: 'My Appointments',      key: 'appointments' },
  { icon: 'fa-user-injured',          label: 'My Patients',          key: 'patients'     },
  { icon: 'fa-prescription-bottle-alt', label: 'Prescriptions',      key: 'prescriptions'},
  { icon: 'fa-video',                 label: 'Video Consultations',  key: 'video'        },
  { icon: 'fa-file-medical-alt',      label: 'Medical Reports',      key: 'reports'      },
  { icon: 'fa-chart-bar',             label: 'Analytics',            key: 'analytics'    },
  { icon: 'fa-comment-dots',          label: 'Feedback',             key: 'feedback'     },
  { divider: true },
  { icon: 'fa-user-circle',           label: 'View / Update Profile',key: 'profile'      },
  { icon: 'fa-cog',                   label: 'Settings',             key: 'settings'     },
]

/* ─── Income Helper ─────────────────────────────────────────── */
// Calculates today's and total income from approved appointments.
// At midnight (00:00), today's income resets to ₹0 automatically
// because we filter by today's date string each render.
function calcIncome(appointments, consultationFee = 500) {
  const todayStr = new Date().toDateString()
  const todayIncome = appointments
    .filter(a => a.doctorApproved === true && new Date(a.appointmentTime).toDateString() === todayStr)
    .length * consultationFee
  const totalIncome = appointments
    .filter(a => a.doctorApproved === true)
    .length * consultationFee
  return { todayIncome, totalIncome }
}

/* ─── Prescription Modal ────────────────────────────────────── */
function PrescriptionModal({ patientId, doctorId, token, onClose, onSuccess }) {
  const [allMedicines, setAllMedicines] = useState([])
  const [selected, setSelected] = useState([])
  const [search, setSearch] = useState('')
  const [dropdown, setDropdown] = useState([])
  const [notes, setNotes] = useState('')
  const showToast = useToast()

  useEffect(() => {
    fetch(`${API}/medicines/all`, { headers: authHeaders(token) })
      .then(r => r.json())
      .then(d => setAllMedicines(Array.isArray(d) ? d : (d.medicines || [])))
      .catch(() => {})
  }, [])

  const handleSearch = (val) => {
    setSearch(val)
    if (!val.trim()) { setDropdown([]); return }
    const needle = val.toLowerCase()
    setDropdown(allMedicines.filter(m =>
      (m.name || '').toLowerCase().includes(needle) ||
      (m.composition || '').toLowerCase().includes(needle)
    ).slice(0, 8))
  }

  const selectMedicine = (name) => {
    if (selected.find(m => m.name === name)) { showToast(`${name} already added`, 'info'); return }
    setSelected(s => [...s, { name, dosage: '', duration: '', frequency: 'Once daily' }])
    setSearch(''); setDropdown([])
  }

  const updateField = (i, field, val) =>
    setSelected(s => s.map((m, idx) => idx === i ? { ...m, [field]: val } : m))

  const remove = (i) => setSelected(s => s.filter((_, idx) => idx !== i))

  const submit = async () => {
    if (!selected.length) { showToast('Add at least one medicine', 'error'); return }
    const invalid = selected.find(m => !m.dosage || !m.duration)
    if (invalid) { showToast(`Fill dosage & duration for ${invalid.name}`, 'error'); return }
    try {
      const res = await fetch(`${API}/prescriptions/add`, {
        method: 'POST', headers: authHeaders(token),
        body: JSON.stringify({ patientId, doctorId, medicines: selected, notes }),
      })
      const data = await res.json()
      if (data.success || data.message?.includes('success')) {
        showToast('Prescription sent!', 'success'); onSuccess?.(); onClose()
      } else { showToast(data.message || 'Failed to send', 'error') }
    } catch { showToast('Server error', 'error') }
  }

  return (
    <div className="modal active">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-container" style={{ maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div className="appointment-modal-header">
          <i className="fas fa-prescription"></i>
          <h2>Write Prescription</h2>
          <p>Patient #{patientId}</p>
        </div>
        <div style={{ padding: '0 1.5rem' }}>
          <label>Search Medicine</label>
          <input type="text" placeholder="Type medicine name..." value={search}
            onChange={e => handleSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, margin: '6px 0' }} />
          {dropdown.length > 0 && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, maxHeight: 160, overflowY: 'auto', background: 'var(--card-bg)' }}>
              {dropdown.map(m => (
                <div key={m.name} onClick={() => selectMedicine(m.name)}
                  style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                  <strong>{m.name}</strong>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}> · {m.dosageForm || ''}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: '1rem' }}>
            {selected.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No medicines added yet.</p>}
            {selected.map((m, i) => (
              <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{m.name}</strong>
                  <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16 }}>
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Dosage</label>
                    <input value={m.dosage} placeholder="e.g. 500mg" onChange={e => updateField(i, 'dosage', e.target.value)}
                      style={{ width: '100%', padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Frequency</label>
                    <select value={m.frequency} onChange={e => updateField(i, 'frequency', e.target.value)}
                      style={{ width: '100%', padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}>
                      {['Once daily', 'Twice daily', 'Thrice daily', 'SOS', 'As needed'].map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Duration</label>
                    <input value={m.duration} placeholder="e.g. 5 days" onChange={e => updateField(i, 'duration', e.target.value)}
                      style={{ width: '100%', padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <label style={{ marginTop: '1rem', display: 'block' }}>Notes</label>
          <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes..."
            style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, resize: 'vertical' }}></textarea>
          <button className="btn btn-primary btn-full" style={{ margin: '1rem 0' }} onClick={submit}>
            <i className="fas fa-paper-plane"></i> Send Prescription
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Meeting Link Card ─────────────────────────────────────── */
function MeetingLinkCard({ link, appointment, onClose }) {
  return (
    <div style={{ position: 'fixed', bottom: 80, right: 24, zIndex: 9999, background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 16, width: 320, boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <strong style={{ fontSize: 14 }}><i className="fas fa-video" style={{ color: '#22c55e' }}></i> Meeting Ready</strong>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>×</button>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
        Patient #{appointment?.patientId} · {new Date(appointment?.appointmentTime).toLocaleString()}
      </p>
      <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 11, wordBreak: 'break-all', marginBottom: 10, color: 'var(--text-secondary)' }}>{link}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => navigator.clipboard.writeText(link)}><i className="fas fa-copy"></i> Copy</button>
        <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => window.open(link, '_blank')}><i className="fas fa-video"></i> Join Now</button>
      </div>
    </div>
  )
}

/* ─── Status Banner ─────────────────────────────────────────── */
function StatusBanner({ status, onAction }) {
  if (status === 'complete') return null
  return (
    <div style={{
      background: status === 'incomplete' ? 'linear-gradient(135deg,#667eea,#764ba2)' : 'linear-gradient(135deg,#f59e0b,#f97316)',
      borderRadius: 16, padding: '1.5rem 2rem', marginBottom: '1.5rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`fas ${status === 'incomplete' ? 'fa-user-edit' : 'fa-clock'}`} style={{ fontSize: 24, color: 'white' }}></i>
        </div>
        <div>
          <h3 style={{ color: 'white', marginBottom: 4, fontSize: '1.1rem' }}>
            {status === 'incomplete' ? 'Complete Your Profile' : 'Awaiting Admin Approval'}
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, margin: 0 }}>
            {status === 'incomplete'
              ? 'Please complete your profile to start using the dashboard and connect with patients.'
              : 'Your profile has been submitted and is pending admin approval. You will be notified once approved.'}
          </p>
        </div>
      </div>
      <button className="btn" onClick={onAction} style={{ background: 'white', color: status === 'incomplete' ? '#667eea' : '#f59e0b', border: 'none', padding: '10px 24px', fontWeight: 600 }}>
        <i className={`fas ${status === 'incomplete' ? 'fa-arrow-right' : 'fa-sync-alt'}`}></i>
        {status === 'incomplete' ? ' Complete Profile' : ' Check Status'}
      </button>
    </div>
  )
}

/* ─── Patient Incoming Banner ───────────────────────────────── */
function PatientIncomingBanner({ requests, onAccept, onReject }) {
  const [preference, setPreference] = useState('')
  if (!requests || requests.length === 0) return null
  const patient = requests[0]
  return (
    <div style={{ background: 'linear-gradient(135deg,#1e40af,#3b82f6,#06b6d4)', borderRadius: 16, padding: '20px 24px', marginBottom: 24, color: 'white', boxShadow: '0 4px 20px rgba(37,99,235,0.3)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
          <i className="fas fa-user-injured"></i>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ background: '#fbbf24', color: '#78350f', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase' }}>New Patient</span>
            <span style={{ fontSize: 12, opacity: 0.8 }}>{patient.createdAt ? timeAgoString(patient.createdAt) : 'Just now'}</span>
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>{patient.patientName || patient.patient?.name || 'Patient'} arriving</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, opacity: 0.9 }}>
            {(patient.symptoms || patient.reason) && <span><i className="fas fa-stethoscope" style={{ marginRight: 4 }}></i>{patient.symptoms || patient.reason}</span>}
          </div>
          <input type="text" placeholder="What do you prefer? (e.g. Video call, In-person...)"
            value={preference} onChange={e => setPreference(e.target.value)}
            style={{ marginTop: 12, width: '100%', padding: '8px 14px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          <button onClick={() => onAccept(patient._id || patient.id)} style={{ background: 'white', color: '#1e40af', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="fas fa-check"></i> Accept
          </button>
          <button onClick={() => onReject(patient._id || patient.id)} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="fas fa-times"></i> Decline
          </button>
        </div>
      </div>
      {requests.length > 1 && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: 12, opacity: 0.85 }}>
          <i className="fas fa-users" style={{ marginRight: 6 }}></i>+{requests.length - 1} more patient request{requests.length > 2 ? 's' : ''} waiting
        </div>
      )}
    </div>
  )
}

/* ─── Availability Toggle ───────────────────────────────────── */
function AvailabilityToggle({ isActive, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 50, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, transition: 'all 0.3s ease',
      background: isActive ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#ef4444,#dc2626)',
      color: 'white', boxShadow: isActive ? '0 2px 12px rgba(16,185,129,0.4)' : '0 2px 12px rgba(239,68,68,0.4)',
    }}>
      <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
        <i className={`fas ${isActive ? 'fa-check' : 'fa-times'}`}></i>
      </span>
      {isActive ? 'Active' : 'Inactive'}
    </button>
  )
}

/* ─── Income Mini Cards ─────────────────────────────────────── */
// Shown inside the welcome header to fill the empty space.
// todayIncome resets automatically at midnight because calcIncome
// filters by new Date().toDateString() on every render.
function IncomeMiniCards({ todayIncome, totalIncome }) {
  const fmt = (n) => '₹' + n.toLocaleString('en-IN')
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
      {/* Today's Income */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)',
        border: '1px solid #6ee7b7', borderRadius: 12,
        padding: '10px 16px', minWidth: 160,
      }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="fas fa-sun" style={{ color: 'white', fontSize: 14 }}></i>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#065f46', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Today's Income</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#064e3b', lineHeight: 1.2 }}>{fmt(todayIncome)}</div>
        </div>
      </div>

      {/* Total Income */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
        border: '1px solid #93c5fd', borderRadius: 12,
        padding: '10px 16px', minWidth: 160,
      }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="fas fa-wallet" style={{ color: 'white', fontSize: 14 }}></i>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#1e3a8a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Income</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1e3a8a', lineHeight: 1.2 }}>{fmt(totalIncome)}</div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function DoctorDashboard() {
  const { currentUser: doctor, token, logout } = useAuth()
  const navigate = useNavigate()
  const showToast = useToast()

  const [profile,              setProfile]              = useState(null)
  const [allAppointments,      setAllAppointments]      = useState([])   // ← store raw list for income calc
  const [stats,                setStats]                = useState({ today: '-', total: '-', newMonth: '-', prescriptions: '-' })
  const [income,               setIncome]               = useState({ todayIncome: 0, totalIncome: 0 })
  const [schedule,             setSchedule]             = useState([])
  const [recentPatients,       setRecentPatients]       = useState([])
  const [pendingPrescriptions, setPendingPrescriptions] = useState([])
  const [requests,             setRequests]             = useState([])
  const [prescriptionModal,    setPrescriptionModal]    = useState(null)
  const [meetingCard,          setMeetingCard]          = useState(null)
  const [currentTime,          setCurrentTime]          = useState(new Date())
  const [userDropdown,         setUserDropdown]         = useState(false)
  const [activeNav,            setActiveNav]            = useState('home')
  const [isActive,             setIsActive]             = useState(() => localStorage.getItem('doctor-is-active') !== 'false')
  const [profileStatus,        setProfileStatus]        = useState({ isProfileComplete: false, isApproved: false, isLoading: true })

  const toggleActive = () => {
    const next = !isActive
    setIsActive(next)
    localStorage.setItem('doctor-is-active', String(next))
    showToast(next ? '✅ You are now Active' : '🔴 You are now Inactive', next ? 'success' : 'info')
  }

  useEffect(() => {
    if (!doctor) { navigate('/'); return }
    checkDoctorProfileStatus()
    loadProfile()
    loadAllApproved()
    loadPrescriptions()
    loadRequests()

    // Tick clock every minute
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now)
      // Recalculate income on each tick — at midnight todayIncome auto-resets
      // because calcIncome uses new Date().toDateString() inside
      setAllAppointments(prev => {
        const { todayIncome, totalIncome } = calcIncome(prev)
        setIncome({ todayIncome, totalIncome })
        return prev
      })
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  async function checkDoctorProfileStatus() {
    try {
      // The profile form saves data into curelex_doctors keyed by email
      // Admin approves by setting isApproved: true, status: 'approved' in same store
      const allDoctors = JSON.parse(localStorage.getItem('curelex_doctors') || '[]')
      const myEntry = allDoctors.find(
        d => d.email === doctor.email || d.id === doctor.id
      )

      if (myEntry) {
        const isComplete = !!(
          myEntry.specialization &&
          myEntry.experience &&
          (myEntry.licenseNumber || myEntry.regNumber)
        )
        const isApproved = myEntry.isApproved === true || myEntry.status === 'approved'
        setProfileStatus({ isProfileComplete: isComplete, isApproved, isLoading: false })
        return
      }

      // Fallback: try the backend API
      const res = await fetch(`${API}/doctors/${doctor.id}`, { headers: authHeaders(token) })
      const data = await res.json()
      const doc = data.doctor || data
      const isComplete = !!(doc.specialization && doc.experience && (doc.licenseNumber || doc.regNumber))
      const isApproved = doc.verificationStatus === 'approved' || doc.isApproved === true
      setProfileStatus({ isProfileComplete: isComplete, isApproved, isLoading: false })
    } catch {
      setProfileStatus({ isProfileComplete: false, isApproved: false, isLoading: false })
    }
  }

  async function loadProfile() {
    try {
      const allDoctors = JSON.parse(localStorage.getItem('curelex_doctors') || '[]')
      const myEntry = allDoctors.find(d => d.email === doctor.email || d.id === doctor.id)
      if (myEntry) {
        setProfile({
          ...myEntry,
          hospital: myEntry.hospital || myEntry.currentInstitute,
          licenseNumber: myEntry.licenseNumber || myEntry.regNumber,
          photo: myEntry.profilePhoto,
        })
        return
      }
      const res = await fetch(`${API}/doctors/${doctor.id}`, { headers: authHeaders(token) })
      const data = await res.json()
      setProfile(data.doctor || data)
    } catch {
      setProfile(doctor)
    }
  }

  async function loadAllApproved() {
    try {
      const res = await fetch(`${API}/appointments/doctor/${doctor.id}`, { headers: authHeaders(token) })
      const data = await res.json()
      const approved = (data.appointments || []).filter(a => a.doctorApproved === true)

      // Store raw list so income can recalculate on midnight tick
      setAllAppointments(approved)

      // Compute income
      const { todayIncome, totalIncome } = calcIncome(approved)
      setIncome({ todayIncome, totalIncome })

      const now = new Date(); const todayStr = now.toDateString()
      setStats(s => ({
        ...s,
        today: approved.filter(a => new Date(a.appointmentTime).toDateString() === todayStr).length,
        total: [...new Set(approved.map(a => a.patientId))].length,
        newMonth: approved.filter(a => { const d = new Date(a.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }).length,
      }))
      setSchedule(approved.filter(a => new Date(a.appointmentTime).toDateString() === todayStr).sort((a, b) => new Date(a.appointmentTime) - new Date(b.appointmentTime)))
      const seen = new Map()
      approved.filter(a => a.doctorId === doctor.id).sort((a, b) => new Date(b.appointmentTime) - new Date(a.appointmentTime)).forEach(a => { if (!seen.has(a.patientId)) seen.set(a.patientId, a) })
      setRecentPatients([...seen.values()].slice(0, 5))
    } catch (err) { console.error(err) }
  }

  async function loadPrescriptions() {
    try {
      const res = await fetch(`${API}/prescriptions/doctor/${doctor.id}`, { headers: authHeaders(token) })
      const data = await res.json()
      const all = data.prescriptions || data || []
      setPendingPrescriptions(all.filter(p => p.status === 'pending'))
      setStats(s => ({ ...s, prescriptions: all.length }))
    } catch (err) { console.error(err) }
  }

  async function loadRequests() {
    try {
      const res = await fetch(`${API}/appointments/doctor/${doctor.id}/pending`, { headers: authHeaders(token) })
      const data = await res.json()
      setRequests(data.appointments || data || [])
    } catch (err) { console.error(err) }
  }

  async function respondToRequest(id, action) {
    try {
      if (action === 'accepted') {
        const res = await fetch(`${API}/appointments/${id}/approve`, { method: 'PATCH', headers: authHeaders(token) })
        const data = await res.json()
        if (data.success) {
          showToast('Appointment approved ✅', 'success')
          if (data.meetingLink) setMeetingCard({ link: data.meetingLink, appointment: data.appointment })
          loadRequests(); loadAllApproved()
        } else { showToast(data.message || 'Approval failed', 'error') }
      } else {
        const res = await fetch(`${API}/appointments/status/${id}`, { method: 'PUT', headers: authHeaders(token), body: JSON.stringify({ status: 'cancelled' }) })
        if (res.ok) { showToast('Request declined.', 'info'); loadRequests() }
      }
    } catch (err) { showToast('Server error: ' + err.message, 'error') }
  }

  const handleLogout = () => { logout(); navigate('/') }
  const d = profile || doctor
  const hour = currentTime.getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'
  const initials = d?.name ? d.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'DR'

  let bannerStatus = null
  if (!profileStatus.isProfileComplete) bannerStatus = 'incomplete'
  else if (!profileStatus.isApproved) bannerStatus = 'pending'
  const isContentVisible = profileStatus.isProfileComplete && profileStatus.isApproved

  if (profileStatus.isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: 48, color: '#2563eb' }}></i>
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pd-layout">
      <style>{`
        .dd-content-area { position: relative; transition: opacity 0.4s ease; }
        .dd-content-area.inactive { opacity: 0.38; pointer-events: none; filter: grayscale(60%); }
        .dd-closed-badge { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); z-index: 10; background: rgba(30,30,30,0.82); color: white; border-radius: 16px; padding: 20px 32px; text-align: center; backdrop-filter: blur(4px); pointer-events: all; white-space: nowrap; }
        .dd-closed-badge h3 { margin: 0 0 6px; font-size: 20px; }
        .dd-closed-badge p  { margin: 0 0 14px; font-size: 13px; opacity: 0.8; }
        @keyframes ping { 75%, 100% { transform: scale(1.5); opacity: 0; } }
      `}</style>

      {/* ════════════ TOPBAR ════════════ */}
      <header className="pd-topbar">
        <a href="/" className="logo" style={{ textDecoration: 'none' }}>
          <img className="logo-img" src="/assets/logo.png" alt="CURELEX" style={{ height: 40 }} />
        </a>

        <div className="pd-topbar__right">
          <div className="pd-topbar__location">
            <i className="fas fa-map-marker-alt"></i>
            {d?.hospital || 'My Clinic'}
            <i className="fas fa-chevron-down" style={{ fontSize: 10 }}></i>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <AvailabilityToggle isActive={isActive} onToggle={toggleActive} />
          </div>

          <div className="pd-user-menu" style={{ display: 'flex' }}>
            <div className="pd-user-menu__trigger" onClick={() => setUserDropdown(o => !o)}>
              <div className="pd-user-menu__avatar">{initials}</div>
              <span className="pd-user-menu__name">Dr. {d?.name}</span>
              <i className="fas fa-chevron-down" style={{ fontSize: 10, color: 'var(--text-secondary)' }}></i>
            </div>
            {userDropdown && (
              <>
                <div className="pd-user-dropdown-overlay" onClick={() => setUserDropdown(false)} />
                <div className="pd-user-dropdown">
                  <div className="pd-user-dropdown__info">
                    <strong>Dr. {d?.name}</strong>
                    <span>{d?.specialization || doctor?.email}</span>
                  </div>
                  <div className="pd-user-dropdown__divider" />
                  {NAV_ITEMS.map((item, i) =>
                    item.divider
                      ? <div key={i} className="pd-user-dropdown__divider" />
                      : (
                        <button key={item.key}
                          className={`pd-user-dropdown__item${activeNav === item.key ? ' active' : ''}`}
                          onClick={() => { setActiveNav(item.key); setUserDropdown(false); if (item.key === 'profile') { navigate('/doctor-profile-view') } else { showToast(`${item.label} coming soon!`, 'info') } }}>
                          <i className={`fas ${item.icon}`}></i> {item.label}
                        </button>
                      )
                  )}
                  <div className="pd-user-dropdown__divider" />
                  <button className="pd-user-dropdown__item pd-user-dropdown__item--danger" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ════════════ MAIN ════════════ */}
      <div className="pd-below-header">
        <div className="pd-main" style={{ width: '100%' }}>
          <main className="pd-body">

            {/* ── Welcome Header (fixed layout + income cards) ── */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              background: 'white', borderRadius: 16, padding: '20px 28px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 24,
              border: '1px solid #f0f0f0', gap: 16, flexWrap: 'wrap',
            }}>
              {/* Left: greeting + income mini-cards */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{greeting} 👋</p>
                <h1 style={{ margin: '4px 0 8px', fontSize: 'clamp(20px,4vw,28px)', fontWeight: 700, color: '#111827' }}>
                  Hi, Dr. {d?.name || 'Doctor'}
                </h1>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#6b7280' }}>
                  {d?.specialization && <span><i className="fas fa-stethoscope" style={{ marginRight: 5, color: '#2563eb' }}></i>{d.specialization}</span>}
                  {d?.hospital && <span><i className="fas fa-hospital" style={{ marginRight: 5, color: '#10b981' }}></i>{d.hospital}</span>}
                  <span>
                    <i className="fas fa-clock" style={{ marginRight: 5, color: '#f59e0b' }}></i>
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · {currentTime.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                </div>

                {/* ── Income Mini Cards: fills the empty space ── */}
                <IncomeMiniCards
                  todayIncome={income.todayIncome}
                  totalIncome={income.totalIncome}
                />
              </div>

              {/* Right: avatar */}
              <div style={{ position: 'relative', flexShrink: 0, alignSelf: 'flex-start' }}>
                <div style={{
                  width: 110, height: 110, borderRadius: '50%',
                  background: d?.photo ? 'transparent' : 'linear-gradient(135deg,#2563eb,#7c3aed)',
                  backgroundImage: d?.photo ? `url(${d.photo})` : undefined,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32, fontWeight: 700, color: 'white',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                }}>
                  {!d?.photo && initials}
                </div>
                <div style={{
                  position: 'absolute', bottom: 2, right: 2, width: 20, height: 20,
                  borderRadius: '50%', background: isActive && isContentVisible ? '#10b981' : '#9ca3af',
                  border: '2.5px solid white', transition: 'background 0.3s',
                }} />
              </div>
            </div>

            {/* Status Banner */}
            {bannerStatus && (
              <StatusBanner
                status={bannerStatus}
                onAction={bannerStatus === 'incomplete' ? () => navigate('/doctor-profile') : () => navigate('/doctor-profile-view')}
              />
            )}

            {/* Patient Incoming Banner */}
            {isContentVisible && isActive && (
              <PatientIncomingBanner requests={requests} onAccept={id => respondToRequest(id, 'accepted')} onReject={id => respondToRequest(id, 'rejected')} />
            )}

            {/* Dashboard Content */}
            {isContentVisible && (
              <div className={`dd-content-area${isActive ? '' : ' inactive'}`}>
                {!isActive && (
                  <div className="dd-closed-badge">
                    <h3>🔴 Clinic Closed</h3>
                    <p>You are currently not accepting patients</p>
                    <button onClick={toggleActive} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Go Active Now</button>
                  </div>
                )}

                {/* Stats */}
                <div className="pd-stats" style={{ marginBottom: 24 }}>
                  {[
                    { icon: 'fa-users',                   cls: '--blue',   num: stats.total,         label: 'Total Patients'          },
                    { icon: 'fa-calendar-check',          cls: '--green',  num: stats.today,         label: "Today's Appointments"    },
                    { icon: 'fa-user-plus',               cls: '--orange', num: stats.newMonth,      label: 'New This Month'          },
                    { icon: 'fa-prescription-bottle-alt', cls: '--purple', num: stats.prescriptions, label: 'Total Prescriptions'     },
                  ].map(s => (
                    <div className="pd-stat-card" key={s.label}>
                      <div className={`pd-stat-card__icon pd-stat-card__icon${s.cls}`}><i className={`fas ${s.icon}`}></i></div>
                      <div><div className="pd-stat-card__num">{s.num}</div><div className="pd-stat-card__label">{s.label}</div></div>
                    </div>
                  ))}
                </div>

                <div className="dashboard-grid">

                  {/* Today's Schedule */}
                  <div className="dashboard-card full-width">
                    <div className="card-header"><i className="fas fa-calendar-day"></i><h3>Today's Schedule</h3></div>
                    <div className="card-body">
                      <div className="schedule-timeline">
                        {schedule.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No appointments scheduled for today.</p>}
                        {schedule.map((appt, i) => {
                          const aptTime = new Date(appt.appointmentTime)
                          const diffMin = (aptTime - new Date()) / 60000
                          const statusClass = diffMin < -30 ? 'completed' : diffMin <= 15 ? 'current' : 'upcoming'
                          const label = { completed: 'Completed', current: 'Now', upcoming: 'Upcoming' }[statusClass]
                          return (
                            <div className={`schedule-item ${statusClass}`} key={i}>
                              <div className="schedule-time">{formatTime(appt.appointmentTime)}</div>
                              <div className="schedule-info">
                                <h4>Patient #{appt.patientId}</h4>
                                <p>{appt.symptoms || 'Consultation'}</p>
                                <span className={`status ${statusClass}`}>{label}</span>
                              </div>
                              <div style={{ display: 'flex', gap: 6 }}>
                                {appt.meetingLink && <button className="btn btn-primary btn-sm" onClick={() => window.open(appt.meetingLink, '_blank')}><i className="fas fa-video"></i> Join</button>}
                                <button className="btn btn-outline btn-sm" onClick={() => setPrescriptionModal({ patientId: appt.patientId, appointmentId: appt.id })}><i className="fas fa-prescription"></i> Prescribe</button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Recent Patients */}
                  <div className="dashboard-card">
                    <div className="card-header"><i className="fas fa-user-injured"></i><h3>Recent Patients</h3></div>
                    <div className="card-body">
                      <div className="patients-list">
                        {recentPatients.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No patients yet.</p>}
                        {recentPatients.map((a, i) => (
                          <div className="patient-item" key={i}>
                            <div className="patient-avatar"><i className="fas fa-user"></i></div>
                            <div className="patient-info">
                              <h4>Patient #{a.patientId}</h4>
                              <p>Last: {formatDate(a.appointmentTime)}</p>
                            </div>
                            <button className="btn btn-outline btn-sm" onClick={() => setPrescriptionModal({ patientId: a.patientId, appointmentId: null })}>Prescribe</button>
                          </div>
                        ))}
                      </div>
                      <button className="btn btn-primary btn-full" style={{ marginTop: '1rem' }} onClick={() => showToast('All patients view coming soon!', 'info')}>
                        <i className="fas fa-users"></i> View All Patients
                      </button>
                    </div>
                  </div>

                  {/* Pending Prescriptions */}
                  <div className="dashboard-card">
                    <div className="card-header"><i className="fas fa-prescription"></i><h3>Pending Prescriptions</h3></div>
                    <div className="card-body">
                      <div className="prescription-list">
                        {pendingPrescriptions.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No pending prescriptions.</p>}
                        {pendingPrescriptions.map((p, i) => (
                          <div className="prescription-item pending" key={i}>
                            <div className="prescription-icon"><i className="fas fa-clock"></i></div>
                            <div className="prescription-info">
                              <h4>{p.patientName || 'Patient'}</h4>
                              <p>Pending since: {p.createdAt ? formatDate(p.createdAt) : 'N/A'}</p>
                            </div>
                            <button className="btn btn-primary btn-sm" onClick={() => showToast('Opening editor...', 'info')}>Write</button>
                          </div>
                        ))}
                      </div>
                      <button className="btn btn-primary btn-full" style={{ marginTop: '1rem' }}
                        onClick={() => { const pid = window.prompt('Enter Patient ID:'); if (pid) setPrescriptionModal({ patientId: parseInt(pid), appointmentId: null }) }}>
                        <i className="fas fa-plus"></i> Write New Prescription
                      </button>
                    </div>
                  </div>

                  {/* Patient Requests */}
                  <div className="dashboard-card">
                    <div className="card-header"><i className="fas fa-user-plus"></i><h3>New Patient Requests</h3></div>
                    <div className="card-body">
                      <div className="request-list">
                        {requests.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No new patient requests.</p>}
                        {requests.map((r, i) => (
                          <div className="request-item" key={i}>
                            <div className="request-avatar"><i className="fas fa-user"></i></div>
                            <div className="request-info">
                              <h4>{r.patientName || r.patient?.name || 'Patient'}</h4>
                              <p>{r.type || r.reason || 'Consultation'}</p>
                              <span className="request-time">Requested: {r.createdAt ? timeAgoString(r.createdAt) : 'Recently'}</span>
                            </div>
                            <div className="request-actions">
                              <button className="btn btn-primary btn-sm" title="Accept" onClick={() => respondToRequest(r._id || r.id, 'accepted')}><i className="fas fa-check"></i></button>
                              <button className="btn btn-outline btn-sm" title="Reject" onClick={() => respondToRequest(r._id || r.id, 'rejected')}><i className="fas fa-times"></i></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Doctor Profile */}
                  <div className="dashboard-card">
                    <div className="card-header"><i className="fas fa-user-md"></i><h3>Your Profile</h3></div>
                    <div className="card-body">
                      <div className="profile-summary">
                        <div className="profile-avatar-large">
                          {d?.photo ? <img src={d.photo} alt="Doctor" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : <i className="fas fa-user-md"></i>}
                        </div>
                        <div className="profile-details">
                          <h4>Dr. {d?.name || '-'}</h4>
                          <p className="specialization">{d?.specialization || '-'}</p>
                          <p className="hospital"><i className="fas fa-hospital"></i> {d?.hospital || d?.regState || 'N/A'}</p>
                          <div className="profile-stats">
                            <div><span className="number">{d?.experience != null ? d.experience + '+' : '-'}</span><span className="label">Years Exp.</span></div>
                            <div><span className="number">{stats.total}+</span><span className="label">Patients</span></div>
                          </div>
                        </div>
                      </div>
                      <button className="btn btn-outline btn-full" onClick={() => navigate('/doctor-profile-view')}>
                        <i className="fas fa-edit"></i> Edit Profile
                      </button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="dashboard-card full-width">
                    <div className="card-header"><i className="fas fa-bolt"></i><h3>Quick Actions</h3></div>
                    <div className="card-body">
                      <div className="quick-actions">
                        {[
                          { icon: 'fa-calendar-plus',          label: 'Schedule Appointment' },
                          { icon: 'fa-prescription-bottle-alt', label: 'Write Prescription'  },
                          { icon: 'fa-file-medical-alt',        label: 'Create Medical Report'},
                          { icon: 'fa-envelope',                label: 'Send Message'         },
                          { icon: 'fa-video',                   label: 'Start Video Call'     },
                          { icon: 'fa-chart-bar',               label: 'View Analytics'       },
                        ].map(a => (
                          <button key={a.label} className="action-btn" onClick={() => showToast(`${a.label} coming soon!`, 'info')}>
                            <i className={`fas ${a.icon}`}></i>
                            <span>{a.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {prescriptionModal && (
        <PrescriptionModal patientId={prescriptionModal.patientId} doctorId={doctor.id} token={token}
          onClose={() => setPrescriptionModal(null)} onSuccess={loadPrescriptions} />
      )}
      {meetingCard && (
        <MeetingLinkCard link={meetingCard.link} appointment={meetingCard.appointment} onClose={() => setMeetingCard(null)} />
      )}
      <Toast />
    </div>
  )
}