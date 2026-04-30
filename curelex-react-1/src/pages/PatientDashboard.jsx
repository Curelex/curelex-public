import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ViewPrescriptionModal from '../components/ViewPrescriptionModal'
import { Toast } from '../components/Toast'
import { API, authHeaders, formatDate, formatTime } from '../utils/helpers'
import '../css/PatientDashboard.css'

/* ─── Sidebar navigation items ─────────────────────────────── */
const NAV_ITEMS = [
  { icon: 'fa-home',          label: 'Dashboard',            key: 'home'         },
  { icon: 'fa-calendar-check',label: 'My Appointments',      key: 'appointments' },
  { icon: 'fa-vial',          label: 'My Tests',             key: 'tests'        },
  { icon: 'fa-pills',         label: 'Medicine Orders',      key: 'medicines'    },
  { icon: 'fa-folder-open',   label: 'Medical Records',      key: 'records'      },
  { icon: 'fa-video',         label: 'Online Consultations', key: 'consult'      },
  { icon: 'fa-comment-dots',  label: 'My Feedback',          key: 'feedback'     },
  { divider: true },
  { icon: 'fa-user-circle',   label: 'View / Update Profile',key: 'profile'      },
  { icon: 'fa-cog',           label: 'Settings',             key: 'settings'     },
]

/* ─── Offerings ─────────────────────────────────────────────── */
const OFFERINGS = [
  { icon: 'fa-video',          label: 'Instant Video Consultation', sub: 'Connect within 60 secs',    color: '#2d6be4', key: 'video'   },
  { icon: 'fa-map-marker-alt', label: 'Find Doctors Near You',      sub: 'Confirmed appointments',    color: '#00b386', key: 'doctors' },
  { icon: 'fa-flask',          label: 'Lab Tests',                  sub: 'Diagnostics tests at home', color: '#f59e0b', key: 'lab'     },
  { icon: 'fa-hospital',       label: 'Surgeries',                  sub: 'Safe and trusted centres',  color: '#7c3aed', key: 'surgery' },
]

const HISTORY = [
  { title: 'Follow-up Complete',   date: 'Jan 10, 2024', doctor: 'Dr. Sarah Johnson' },
  { title: 'Initial Consultation', date: 'Dec 15, 2023', doctor: 'Dr. Amit Patel'    },
  { title: 'Follow-up Complete',   date: 'Nov 20, 2023', doctor: 'Dr. Emily Chen'    },
  { title: 'Initial Consultation', date: 'Oct 05, 2023', doctor: 'Dr. Sarah Johnson' },
]

const RECORDS = [
  { icon: 'fa-file-pdf',         title: 'Blood Test Report',  date: 'Jan 10, 2024' },
  { icon: 'fa-file-image',       title: 'X-Ray Chest',        date: 'Dec 20, 2023' },
  { icon: 'fa-file-alt',         title: 'ECG Report',         date: 'Nov 15, 2023' },
  { icon: 'fa-file-medical-alt', title: 'Health Certificate', date: 'Oct 05, 2023' },
]

const PROGRESS_STEPS  = ['Consulted', 'Prescribed', 'In Treatment', 'Complete']
const FOLLOWUP_DETAILS = [
  { icon: 'fa-user-md',   label: 'Doctor',      value: 'Dr. Sarah Johnson'    },
  { icon: 'fa-calendar',  label: 'Next Visit',  value: 'January 25, 2024'     },
  { icon: 'fa-heartbeat', label: 'Status',      value: 'Recovery in Progress' },
  { icon: 'fa-pills',     label: 'Medications', value: '3 prescribed'         },
]

/* ─── Speciality cards with specialization mapping ──────────── */
const CONSULT_SPECIALITIES = [
  { label: 'Period doubts or Pregnancy',  icon: 'fa-venus',           color: '#f9a8d4', spec: 'Gynaecologist'     },
  { label: 'Acne, pimple or skin issues', icon: 'fa-face-meh',        color: '#fcd34d', spec: 'Dermatologist'     },
  { label: 'Performance issues in bed',   icon: 'fa-heart-pulse',     color: '#f87171', spec: 'General Physician' },
  { label: 'Cold, cough or fever',        icon: 'fa-head-side-cough', color: '#93c5fd', spec: 'General Physician' },
  { label: 'Child not feeling well',      icon: 'fa-baby',            color: '#86efac', spec: 'Paediatrician'     },
  { label: 'Depression or anxiety',       icon: 'fa-brain',           color: '#c4b5fd', spec: 'Psychiatrist'      },
]

/* ═══════════════════════════════════════════════════════════════
   DOCTOR CARD — used in both "Find Doctors" modal and Telemedicine
   ═══════════════════════════════════════════════════════════════ */
export function DoctorCard({ doc, onBook }) {
  const isApproved = doc.verificationStatus === 'approved'

  return (
    <div style={{
      border: `1.5px solid ${isApproved ? '#d1fae5' : '#e5e7eb'}`,
      borderRadius: 14,
      padding: '18px 20px',
      background: isApproved ? '#fff' : '#f9fafb',
      opacity: isApproved ? 1 : 0.55,
      filter: isApproved ? 'none' : 'grayscale(60%)',
      transition: 'all 0.2s',
      display: 'flex',
      gap: 16,
      alignItems: 'flex-start',
      position: 'relative',
      boxShadow: isApproved ? '0 2px 12px rgba(0,179,134,0.08)' : 'none',
    }}>
      {/* Avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {doc.photoUrl ? (
          <img src={doc.photoUrl} alt={doc.name}
            style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover',
              border: `2.5px solid ${isApproved ? '#00b386' : '#d1d5db'}` }} />
        ) : (
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: isApproved ? 'linear-gradient(135deg,#00b386,#2d6be4)' : '#e5e7eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 700, color: isApproved ? 'white' : '#9ca3af',
          }}>
            {doc.name?.charAt(0)?.toUpperCase() || 'D'}
          </div>
        )}
        <span style={{
          position: 'absolute', bottom: 2, right: 2,
          width: 14, height: 14, borderRadius: '50%',
          background: isApproved ? '#10b981' : '#9ca3af',
          border: '2px solid white',
        }} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: isApproved ? '#111827' : '#6b7280' }}>
            Dr. {doc.name}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
            background: isApproved ? '#dcfce7' : doc.verificationStatus === 'rejected' ? '#fee2e2' : '#fef9c3',
            color:      isApproved ? '#16a34a' : doc.verificationStatus === 'rejected' ? '#dc2626' : '#ca8a04',
          }}>
            {isApproved ? '● Active' : doc.verificationStatus === 'rejected' ? '✕ Rejected' : '⏳ Pending'}
          </span>
        </div>

        {doc.specialization && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
            <i className="fas fa-stethoscope" style={{ fontSize: 12, color: isApproved ? '#00b386' : '#9ca3af' }}></i>
            <span style={{ fontSize: 13, fontWeight: 600, color: isApproved ? '#0f766e' : '#9ca3af' }}>
              {doc.specialization}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
          {doc.experience != null && (
            <span><i className="fas fa-briefcase-medical" style={{ marginRight: 4 }}></i>{doc.experience} yr{doc.experience !== 1 ? 's' : ''} exp.</span>
          )}
          {doc.patientsHandeled != null && (
            <span><i className="fas fa-users" style={{ marginRight: 4 }}></i>{doc.patientsHandeled.toLocaleString()} patients</span>
          )}
          {doc.gender && (
            <span style={{ textTransform: 'capitalize' }}>
              <i className={`fas fa-${doc.gender === 'female' ? 'venus' : 'mars'}`} style={{ marginRight: 4 }}></i>{doc.gender}
            </span>
          )}
          {doc.regState && (
            <span><i className="fas fa-map-marker-alt" style={{ marginRight: 4 }}></i>{doc.regState}</span>
          )}
        </div>

        {isApproved && onBook && (
          <button onClick={() => onBook(doc)}
            style={{
              background: 'linear-gradient(135deg,#00b386,#2d6be4)',
              color: 'white', border: 'none', borderRadius: 8,
              padding: '7px 18px', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
            <i className="fas fa-calendar-plus"></i> Book Appointment
          </button>
        )}

        {!isApproved && (
          <span style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>
            Currently unavailable for appointments
          </span>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   DOCTORS MODAL
   ═══════════════════════════════════════════════════════════════ */
function DoctorsModal({ onClose, token, onBook }) {
  const [doctors,     setDoctors]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSpec,  setFilterSpec]  = useState('All')

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const res  = await fetch(`${API}/doctors`, { headers: authHeaders(token) })
        const data = await res.json()
        const list = data.doctors || (Array.isArray(data) ? data : [])
        setDoctors(list)
      } catch (err) {
        console.error('Failed to load doctors:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDoctors()
  }, [token])

  const specializations = ['All', ...new Set(
    doctors.filter(d => d.specialization).map(d => d.specialization)
  )]

  const filtered = doctors.filter(d => {
    const matchSearch = !searchQuery ||
      d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchSpec = filterSpec === 'All' || d.specialization === filterSpec
    return matchSearch && matchSpec
  })

  const sorted = [...filtered].sort((a, b) => {
    const order = { approved: 0, pending: 1, rejected: 2 }
    return (order[a.verificationStatus] ?? 1) - (order[b.verificationStatus] ?? 1)
  })

  const approvedCount = doctors.filter(d => d.verificationStatus === 'approved').length
  const inactiveCount = doctors.length - approvedCount

  return (
    <div className="pd-modal-overlay" onClick={onClose}>
      <div
        className="pd-modal pd-doctors-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 860, width: '95vw', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        <div className="pd-modal__head" style={{ position: 'relative', flexShrink: 0 }}>
          <button className="pd-modal__close" onClick={onClose} style={{ position: 'absolute', top: 14, right: 14 }}>
            <i className="fas fa-times"></i>
          </button>
          <div className="pd-modal__head-icon" style={{ background: '#e6f7f3', color: '#00b386' }}>
            <i className="fas fa-user-md"></i>
          </div>
          <h2>Find Doctors Near You</h2>
          <p>Browse all available doctors and their specializations</p>
        </div>

        <div style={{ padding: '0 24px 16px', flexShrink: 0 }}>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14 }}></i>
            <input
              type="text"
              placeholder="Search by name or specialization…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px 10px 36px',
                border: '1.5px solid #e5e7eb', borderRadius: 10,
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
                fontFamily: 'inherit', color: '#1f2937', transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#00b386'}
              onBlur={e  => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          {specializations.length > 1 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {specializations.map(spec => (
                <button key={spec} onClick={() => setFilterSpec(spec)} style={{
                  padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                  border: '1.5px solid', cursor: 'pointer', transition: 'all 0.18s',
                  borderColor: filterSpec === spec ? '#00b386' : '#e5e7eb',
                  background:  filterSpec === spec ? '#00b386' : '#fff',
                  color:       filterSpec === spec ? '#fff'    : '#6b7280',
                  fontFamily: 'inherit'
                }}>
                  {spec}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '0 24px 12px', display: 'flex', gap: 20, flexShrink: 0 }}>
          {[
            { color: '#10b981', label: 'Active (Approved)' },
            { color: '#9ca3af', label: 'Inactive (Pending / Rejected)' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, display: 'inline-block' }}></span>
              {l.label}
            </div>
          ))}
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: 28, marginBottom: 12, display: 'block' }}></i>
              Loading doctors…
            </div>
          ) : sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
              <i className="fas fa-user-slash" style={{ fontSize: 28, marginBottom: 12, display: 'block' }}></i>
              No doctors found
            </div>
          ) : (
            sorted.map(doc => (
              <DoctorCard key={doc.id} doc={doc} onBook={onBook} />
            ))
          )}
        </div>

        {!loading && (
          <div style={{ padding: '12px 24px', borderTop: '1px solid #f3f4f6', fontSize: 12, color: '#9ca3af', flexShrink: 0, display: 'flex', justifyContent: 'space-between' }}>
            <span>Showing <strong>{sorted.length}</strong> of <strong>{doctors.length}</strong> doctors</span>
            <span>
              <strong style={{ color: '#10b981' }}>{approvedCount}</strong> active &nbsp;·&nbsp;
              <strong style={{ color: '#9ca3af' }}>{inactiveCount}</strong> inactive
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function PatientDashboard() {
  const { currentUser, token, logout } = useAuth()
  const navigate = useNavigate()

  const [stats,            setStats]            = useState({ upcoming: 0, prescriptions: 0, total: 0, doctors: 0 })
  const [appointments,     setAppointments]     = useState({ approved: [], pending: [], expired: [] })
  const [prescriptions,    setPrescriptions]    = useState([])
  const [viewPrescription, setViewPrescription] = useState(null)
  const [appointmentModal, setAppointmentModal] = useState(false)
  const [doctorsModal,     setDoctorsModal]     = useState(false)
  const [sidebarOpen,      setSidebarOpen]      = useState(false)
  const [activeNav,        setActiveNav]        = useState('home')
  const [userDropdown,     setUserDropdown]     = useState(false)
  const [userLocation,     setUserLocation]     = useState({ city: 'Detecting…', loading: true })

  useEffect(() => {
    if (!currentUser) { navigate('/'); return }
    loadAppointments()
    loadPrescriptions()
    detectLocation()
  }, [])

  async function detectLocation() {
    const cached = localStorage.getItem('curelex_location')
    if (cached) setUserLocation({ city: cached, loading: false })
    else         setUserLocation({ city: 'Detecting...', loading: true })

    const APIs = [
      async () => { const r = await fetch('https://ipwho.is/');                                          const d = await r.json(); if (d.success && d.city) return d.city },
      async () => { const r = await fetch('https://get.geojs.io/v1/ip/geo.json');                       const d = await r.json(); if (d.city) return d.city; if (d.region) return d.region },
      async () => { const r = await fetch('https://ipapi.co/json/');                                     const d = await r.json(); if (d.city) return d.city },
      async () => { const r = await fetch('https://pro.ip-api.com/json?fields=city,regionName,status'); const d = await r.json(); if (d.status === 'success' && d.city) return d.city },
    ]
    for (const apiFn of APIs) {
      try {
        const city = await apiFn()
        if (city) { setUserLocation({ city, loading: false }); localStorage.setItem('curelex_location', city); return }
      } catch (e) { console.warn('[Location] API failed:', e.message) }
    }
    setUserLocation({ city: cached || 'Set Location', loading: false })
  }

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth > 768) setSidebarOpen(false) }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  async function loadAppointments() {
    try {
      const res  = await fetch(`${API}/appointments/patient/${currentUser.id}`, { headers: authHeaders(token) })
      const data = await res.json()
      if (!data.success || !data.appointments?.length) return
      const all           = data.appointments
      const now           = new Date()
      const approved      = all.filter(a =>  a.doctorApproved && new Date(a.appointmentTime) > now && a.status === 'scheduled')
      const pending       = all.filter(a => !a.doctorApproved && new Date(a.appointmentTime) > now && a.status === 'scheduled')
      const expired       = all.filter(a => !a.doctorApproved && new Date(a.appointmentTime) <= now)
      const uniqueDoctors = [...new Set(all.filter(a => a.doctorApproved).map(a => a.doctorId))].length
      setStats(s => ({ ...s, upcoming: approved.length, total: all.length, doctors: uniqueDoctors }))
      setAppointments({ approved, pending, expired })
    } catch (err) { console.error(err) }
  }

  async function loadPrescriptions() {
    try {
      const res  = await fetch(`${API}/prescriptions/patient/${currentUser.id}`, { headers: authHeaders(token) })
      const data = await res.json()
      if (data.success && data.prescriptions?.length) {
        setPrescriptions(data.prescriptions)
        setStats(s => ({ ...s, prescriptions: data.prescriptions.length }))
      }
    } catch (err) { console.error(err) }
  }

  const handleNav = (key, closeFn) => {
    if      (key === 'feedback') navigate('/feedback')
    else if (key === 'profile')  navigate('/patient-profile-view')
    else                         setActiveNav(key)
    if (closeFn) closeFn()
  }

  const handleLogout = () => {
    localStorage.removeItem('curelex_location')
    logout()
    navigate('/')
  }

  const handleAppointmentChoice = (flow) => {
    setAppointmentModal(false)
    if (flow === 'telemedicine') navigate('/telemedicine')
    else {
      const params = new URLSearchParams({ name: currentUser.name, email: currentUser.email })
      window.open(`https://eclinic.example.com/book?${params}`, '_blank')
    }
  }

  const handleBookDoctor = (doc) => {
    setDoctorsModal(false)
    navigate('/telemedicine', { state: { selectedDoctor: doc } })
  }

  const handleOfferingClick = (key) => {
    if      (key === 'doctors') setDoctorsModal(true)
    else if (key === 'video')   navigate('/telemedicine')
  }

  // ✅ Navigate to telemedicine with specialization filter pre-applied
  const handleConsultNow = (spec) => {
    navigate('/telemedicine', { state: { filterSpec: spec } })
  }

  const now      = new Date()
  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  return (
    <div className="pd-layout">

      {/* ══ TOPBAR ══ */}
      <header className="pd-topbar">
        <Link to="/" className="logo">
          <img className="logo-img" src="/assets/logo.png" alt="CURELEX" />
        </Link>
        <div className="pd-topbar__right">

          <div className="pd-topbar__location" title="Click to refresh location" onClick={detectLocation} style={{ cursor: 'pointer' }}>
            <i className={`fas ${userLocation.loading ? 'fa-spinner fa-spin' : 'fa-map-marker-alt'}`}></i>
            {userLocation.city}
            {!userLocation.loading && <i className="fas fa-chevron-down" style={{ fontSize: 10 }}></i>}
          </div>

          <div className="pd-topbar__search">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Search doctors, clinics, hospitals…" />
          </div>

          <div className="pd-user-menu">
            <div className="pd-user-menu__trigger" onClick={() => setUserDropdown(o => !o)}>
              <div className="pd-user-menu__avatar">{initials}</div>
              <span className="pd-user-menu__name">{currentUser?.name}</span>
              <i className="fas fa-chevron-down" style={{ fontSize: 10, color: 'var(--text-secondary)' }}></i>
            </div>
            {userDropdown && (
              <>
                <div className="pd-user-dropdown-overlay" onClick={() => setUserDropdown(false)} />
                <div className="pd-user-dropdown">
                  <div className="pd-user-dropdown__info">
                    <strong>{currentUser?.name}</strong>
                    <span>{currentUser?.email}</span>
                  </div>
                  <div className="pd-user-dropdown__divider" />
                  {NAV_ITEMS.map((item, i) =>
                    item.divider
                      ? <div key={i} className="pd-user-dropdown__divider" />
                      : (
                        <button
                          key={item.key}
                          className={`pd-user-dropdown__item${activeNav === item.key ? ' active' : ''}`}
                          onClick={() => handleNav(item.key, () => setUserDropdown(false))}
                        >
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

      <div className="pd-below-header">
        <div className={`pd-sidebar-overlay${sidebarOpen ? ' visible' : ''}`} onClick={() => setSidebarOpen(false)} />

        {/* ══ SIDEBAR ══ */}
        <aside className={`pd-sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="pd-sidebar__profile">
            <div className="pd-sidebar__avatar">{initials}</div>
            <div>
              <div className="pd-sidebar__name">{currentUser?.name || 'Patient'}</div>
              <div className="pd-sidebar__phone">{currentUser?.email || ''}</div>
            </div>
          </div>
          <nav className="pd-sidebar__nav">
            {NAV_ITEMS.map((item, i) =>
              item.divider
                ? <div key={i} className="pd-nav-divider" />
                : (
                  <div
                    key={item.key}
                    className={`pd-nav-item${activeNav === item.key ? ' active' : ''}`}
                    onClick={() => handleNav(item.key, () => setSidebarOpen(false))}
                  >
                    <i className={`fas ${item.icon}`}></i>
                    {item.label}
                  </div>
                )
            )}
          </nav>
          <div className="pd-sidebar__footer">
            <button className="pd-logout-btn" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </aside>

        {/* ══ MAIN ══ */}
        <div className="pd-main">
          <main className="pd-body">

            {/* Quick Stats */}
            <div className="pd-stats">
              {[
                { icon: 'fa-calendar-check',      cls: '--blue',   num: stats.upcoming,      label: 'Upcoming Appointments' },
                { icon: 'fa-prescription-bottle', cls: '--green',  num: stats.prescriptions, label: 'Prescriptions'         },
                { icon: 'fa-file-medical',        cls: '--orange', num: stats.total,         label: 'Total Appointments'    },
                { icon: 'fa-user-md',             cls: '--purple', num: stats.doctors,       label: 'Doctors Consulted'     },
              ].map(s => (
                <div className="pd-stat-card" key={s.label}>
                  <div className={`pd-stat-card__icon pd-stat-card__icon${s.cls}`}><i className={`fas ${s.icon}`}></i></div>
                  <div>
                    <div className="pd-stat-card__num">{s.num}</div>
                    <div className="pd-stat-card__label">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Our Offerings */}
            <div className="pd-offerings">
              <div className="pd-section-header">
                <div><h2>Our Offerings</h2><p>Everything you need for your health in one place</p></div>
              </div>
              <div className="pd-offerings-grid">
                {OFFERINGS.map(o => (
                  <div
                    className="pd-offering-card" key={o.label}
                    onClick={() => handleOfferingClick(o.key)}
                    style={{ cursor: (o.key === 'doctors' || o.key === 'video') ? 'pointer' : 'default' }}
                  >
                    <div className="pd-offering-card__icon" style={{ background: o.color + '1a', color: o.color }}>
                      <i className={`fas ${o.icon}`}></i>
                    </div>
                    <h4>{o.label}</h4>
                    <p>{o.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ══ Consult Specialities ══ */}
            <div className="consult-section-wrapper">
              <section className="consult-section">
                <div className="consult-header">
                  <div>
                    <h2>Consult top doctors online for any health concern</h2>
                    <p>Private online consultations with verified doctors in all specialists</p>
                  </div>
                  {/* ✅ View All → goes to telemedicine with no filter */}
                  <button
                    className="btn-view-all"
                    onClick={() => navigate('/telemedicine')}
                  >
                    View All Specialities
                  </button>
                </div>
                <div className="consult-grid">
                  {CONSULT_SPECIALITIES.map((item, i) => (
                    <div className="consult-card" key={i}>
                      <div className="consult-img-wrap" style={{ background: item.color + '33' }}>
                        <i className={`fas ${item.icon}`} style={{ fontSize: 36, color: item.color }}></i>
                      </div>
                      <p>{item.label}</p>
                      {/* ✅ CONSULT NOW navigates to telemedicine with filterSpec in state */}
                      <button
                        className="consult-now-btn"
                        onClick={() => handleConsultNow(item.spec)}
                      >
                        CONSULT NOW
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Dashboard Cards Grid */}
            <div className="pd-grid">

              {/* Upcoming Appointments */}
              <div className="pd-card">
                <div className="pd-card__head">
                  <div className="pd-card__head-icon"><i className="fas fa-calendar-alt"></i></div>
                  <h3>Upcoming Appointments</h3>
                </div>
                <div className="pd-card__body">
                  {!appointments.approved.length && !appointments.pending.length && (
                    <div className="pd-empty"><i className="fas fa-calendar-times"></i> No upcoming appointments</div>
                  )}
                  {appointments.approved.map((apt, i) => {
                    const d             = new Date(apt.appointmentTime)
                    const diffMin       = (d - now) / 60000
                    const joinAvailable = apt.meetingLink && diffMin <= 30 && diffMin >= -60
                    return (
                      <div className="pd-appt-item" key={i}>
                        <div className="pd-appt-date">
                          <span className="day">{d.getDate()}</span>
                          <span className="month">{d.toLocaleString('en-US', { month: 'short' })}</span>
                        </div>
                        <div className="pd-appt-info">
                          <h4>Confirmed Appointment</h4>
                          <p>Dr. #{apt.doctorId} · {formatTime(apt.appointmentTime)}</p>
                          <span className="badge badge--green">✅ Approved</span>
                          {joinAvailable ? (
                            <a href={apt.meetingLink} target="_blank" rel="noopener noreferrer" className="pd-video-link">
                              <i className="fas fa-video"></i> Join Video Call
                            </a>
                          ) : apt.meetingLink ? (
                            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>Video link ready · available 30 min before</p>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                  {appointments.pending.map((apt, i) => {
                    const d = new Date(apt.appointmentTime)
                    return (
                      <div className="pd-appt-item" key={`p-${i}`} style={{ opacity: 0.8 }}>
                        <div className="pd-appt-date">
                          <span className="day">{d.getDate()}</span>
                          <span className="month">{d.toLocaleString('en-US', { month: 'short' })}</span>
                        </div>
                        <div className="pd-appt-info">
                          <h4>Appointment Request</h4>
                          <p>Doctor #{apt.doctorId} · {formatTime(apt.appointmentTime)}</p>
                          <span className="badge badge--yellow">⏳ Awaiting Approval</span>
                        </div>
                      </div>
                    )
                  })}
                  {appointments.expired.length > 0 && (
                    <div className="pd-expired-notice">
                      <i className="fas fa-exclamation-circle"></i>
                      {appointments.expired.length} past request{appointments.expired.length > 1 ? 's' : ''} expired. Please book a new appointment.
                    </div>
                  )}
                </div>
                <div className="pd-card__footer">
                  <button className="pd-btn pd-btn--primary pd-btn--full" onClick={() => setAppointmentModal(true)}>
                    <i className="fas fa-calendar-plus"></i> Book New Appointment
                  </button>
                </div>
              </div>

              {/* Past Prescriptions */}
              <div className="pd-card">
                <div className="pd-card__head">
                  <div className="pd-card__head-icon"><i className="fas fa-prescription-bottle-alt"></i></div>
                  <h3>Past Prescriptions</h3>
                </div>
                <div className="pd-card__body">
                  {prescriptions.length === 0 && (
                    <div className="pd-empty"><i className="fas fa-file-prescription"></i> No prescriptions yet</div>
                  )}
                  {prescriptions.map((p, i) => (
                    <div className="pd-rx-item" key={i}>
                      <div className="pd-rx-avatar"><i className="fas fa-user-md"></i></div>
                      <div className="pd-rx-info">
                        <h4>{p.doctorName || `Dr. #${p.doctorId || '-'}`}</h4>
                        <p>{p.department || 'General'}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <span className="pd-rx-date">{formatDate(p.createdAt)}</span>
                        <button className="pd-btn pd-btn--outline pd-btn--sm" onClick={() => setViewPrescription(p)}>View</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Symptoms */}
              <div className="pd-card">
                <div className="pd-card__head">
                  <div className="pd-card__head-icon"><i className="fas fa-thermometer-half"></i></div>
                  <h3>Current Symptoms</h3>
                </div>
                <div className="pd-card__body">
                  {[
                    { name: 'Fever & Cold', date: 'Jan 15, 2024', status: 'pending'  },
                    { name: 'Headache',     date: 'Jan 14, 2024', status: 'resolved' },
                  ].map(s => (
                    <div className="pd-symptom-item" key={s.name}>
                      <div className={`pd-symptom-dot pd-symptom-dot--${s.status}`}></div>
                      <div className="pd-symptom-info"><h4>{s.name}</h4><p>Reported: {s.date}</p></div>
                      <span className={`badge ${s.status === 'pending' ? 'badge--yellow' : 'badge--green'}`}>
                        {s.status === 'pending' ? 'Under Review' : 'Resolved'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pd-card__footer">
                  <button className="pd-btn pd-btn--outline pd-btn--full"><i className="fas fa-plus"></i> Report New Symptom</button>
                </div>
              </div>

              {/* Follow-up History */}
              <div className="pd-card">
                <div className="pd-card__head">
                  <div className="pd-card__head-icon"><i className="fas fa-history"></i></div>
                  <h3>Follow-Up History</h3>
                </div>
                <div className="pd-card__body">
                  <div className="pd-timeline">
                    {HISTORY.map((item, i) => (
                      <div className="pd-timeline-item" key={i}>
                        <h4>{item.title}</h4><p>{item.date}</p>
                        <span className="doctor">{item.doctor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Current Follow-Up Status */}
              <div className="pd-card pd-card--wide">
                <div className="pd-card__head">
                  <div className="pd-card__head-icon"><i className="fas fa-calendar-check"></i></div>
                  <h3>Current Follow-Up Status</h3>
                </div>
                <div className="pd-card__body">
                  <div className="pd-followup-progress">
                    {PROGRESS_STEPS.map((label, i) => (
                      <div key={label} className={`pd-progress-step${i < 3 ? (i < 2 ? ' done' : ' active') : ''}`}>
                        <div className="pd-progress-step__dot"><i className={`fas ${i < 2 ? 'fa-check' : 'fa-circle'}`}></i></div>
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pd-followup-details">
                    {FOLLOWUP_DETAILS.map(d => (
                      <div className="pd-detail-row" key={d.label}>
                        <i className={`fas ${d.icon}`}></i>
                        <div><strong>{d.label}</strong><span>{d.value}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Medical Records */}
              <div className="pd-card pd-card--wide">
                <div className="pd-card__head">
                  <div className="pd-card__head-icon"><i className="fas fa-folder-open"></i></div>
                  <h3>Medical Records</h3>
                </div>
                <div className="pd-card__body">
                  <div className="pd-records-grid">
                    {RECORDS.map(r => (
                      <div className="pd-record-item" key={r.title}>
                        <i className={`fas ${r.icon}`}></i>
                        <h4>{r.title}</h4><p>{r.date}</p>
                        <button className="pd-btn pd-btn--outline pd-btn--sm">Download</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>{/* end pd-grid */}
          </main>
        </div>
      </div>

      {/* ══ APPOINTMENT MODAL ══ */}
      {appointmentModal && (
        <div className="pd-modal-overlay" onClick={() => setAppointmentModal(false)}>
          <div className="pd-modal" onClick={e => e.stopPropagation()}>
            <div className="pd-modal__head" style={{ position: 'relative' }}>
              <button className="pd-modal__close" onClick={() => setAppointmentModal(false)} style={{ position: 'absolute', top: 14, right: 14 }}>
                <i className="fas fa-times"></i>
              </button>
              <div className="pd-modal__head-icon"><i className="fas fa-calendar-plus"></i></div>
              <h2>Book New Appointment</h2>
              <p>Choose your preferred consultation type</p>
            </div>
            <div className="pd-modal__body">
              <div className="pd-appt-option" onClick={() => handleAppointmentChoice('telemedicine')}>
                <div className="pd-appt-option__icon" style={{ background: '#e8effd', color: '#2d6be4' }}><i className="fas fa-video"></i></div>
                <h3>Telemedicine</h3>
                <p>Online video consultation from home. Fast and convenient.</p>
                <button className="pd-btn pd-btn--primary pd-btn--full">Continue</button>
              </div>
              <div className="pd-appt-option" onClick={() => handleAppointmentChoice('eclinic')}>
                <div className="pd-appt-option__icon" style={{ background: '#e6f7f3', color: '#00b386' }}><i className="fas fa-clinic-medical"></i></div>
                <h3>E-Clinic</h3>
                <p>Visit partner clinics for in-person consultation.</p>
                <button className="pd-btn pd-btn--green pd-btn--full">Continue</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ DOCTORS MODAL ══ */}
      {doctorsModal && (
        <DoctorsModal
          onClose={() => setDoctorsModal(false)}
          token={token}
          onBook={handleBookDoctor}
        />
      )}

      {/* ── View Prescription Modal ── */}
      {viewPrescription && <ViewPrescriptionModal prescription={viewPrescription} onClose={() => setViewPrescription(null)} />}

      <Toast />
    </div>
  )
}