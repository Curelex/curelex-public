import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import DashboardHeader from '../components/DashboardHeader'
import ViewPrescriptionModal from '../components/ViewPrescriptionModal'
import { Toast } from '../components/Toast'
import { API, authHeaders, formatDate, formatTime } from '../utils/helpers'
import '../css/PatientDashboard.css'

/* ─── Sidebar navigation items ─────────────────────────────── */
const NAV_ITEMS = [
  { icon: 'fa-home',                    label: 'Dashboard',              key: 'home' },
  { icon: 'fa-calendar-check',          label: 'My Appointments',        key: 'appointments' },
  { icon: 'fa-vial',                    label: 'My Tests',               key: 'tests' },
  { icon: 'fa-pills',                   label: 'Medicine Orders',        key: 'medicines' },
  { icon: 'fa-folder-open',             label: 'Medical Records',        key: 'records' },
  { icon: 'fa-video',                   label: 'Online Consultations',   key: 'consult' },
  { icon: 'fa-comment-dots',            label: 'My Feedback',            key: 'feedback' },
  { divider: true },
  { icon: 'fa-user-circle',             label: 'View / Update Profile',  key: 'profile' },
  { icon: 'fa-cog',                     label: 'Settings',               key: 'settings' },
]

/* ─── Offerings ─────────────────────────────────────────────── */
const OFFERINGS = [
  { icon: 'fa-video',           label: 'Instant Video Consultation',  sub: 'Connect within 60 secs',      color: '#2d6be4' },
  { icon: 'fa-map-marker-alt',  label: 'Find Doctors Near You',       sub: 'Confirmed appointments',      color: '#00b386' },
  { icon: 'fa-flask',           label: 'Lab Tests',                   sub: 'Diagnostics tests at home',   color: '#f59e0b' },
  { icon: 'fa-hospital',        label: 'Surgeries',                   sub: 'Safe and trusted centres',    color: '#7c3aed' },
]

/* ─── Static follow-up history ──────────────────────────────── */
const HISTORY = [
  { title: 'Follow-up Complete',    date: 'Jan 10, 2024', doctor: 'Dr. Sarah Johnson' },
  { title: 'Initial Consultation',  date: 'Dec 15, 2023', doctor: 'Dr. Amit Patel'   },
  { title: 'Follow-up Complete',    date: 'Nov 20, 2023', doctor: 'Dr. Emily Chen'   },
  { title: 'Initial Consultation',  date: 'Oct 05, 2023', doctor: 'Dr. Sarah Johnson'},
]

/* ─── Static medical records ────────────────────────────────── */
const RECORDS = [
  { icon: 'fa-file-pdf',         title: 'Blood Test Report',  date: 'Jan 10, 2024'  },
  { icon: 'fa-file-image',       title: 'X-Ray Chest',        date: 'Dec 20, 2023'  },
  { icon: 'fa-file-alt',         title: 'ECG Report',         date: 'Nov 15, 2023'  },
  { icon: 'fa-file-medical-alt', title: 'Health Certificate', date: 'Oct 05, 2023'  },
]

/* ─── Follow-up progress steps ──────────────────────────────── */
const PROGRESS_STEPS = ['Consulted', 'Prescribed', 'In Treatment', 'Complete']

/* ─── Follow-up detail rows ─────────────────────────────────── */
const FOLLOWUP_DETAILS = [
  { icon: 'fa-user-md',   label: 'Doctor',      value: 'Dr. Sarah Johnson'      },
  { icon: 'fa-calendar',  label: 'Next Visit',  value: 'January 25, 2024'       },
  { icon: 'fa-heartbeat', label: 'Status',      value: 'Recovery in Progress'   },
  { icon: 'fa-pills',     label: 'Medications', value: '3 prescribed'           },
]

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function PatientDashboard() {
  const { currentUser, token, logout } = useAuth()
  const navigate = useNavigate()

  /* ── state ── */
  const [stats,           setStats]           = useState({ upcoming: 0, prescriptions: 0, total: 0, doctors: 0 })
  const [appointments,    setAppointments]    = useState({ approved: [], pending: [], expired: [] })
  const [prescriptions,   setPrescriptions]   = useState([])
  const [viewPrescription,setViewPrescription]= useState(null)
  const [appointmentModal,setAppointmentModal]= useState(false)
  const [sidebarOpen,     setSidebarOpen]     = useState(false)
  const [activeNav,       setActiveNav]       = useState('home')
  const [userDropdown,    setUserDropdown]    = useState(false)
  const [userLocation,    setUserLocation]    = useState({ city: 'Detecting…', loading: true })

  /* ── redirect if no user ── */
  useEffect(() => {
    if (!currentUser) { navigate('/'); return }
    loadAppointments()
    loadPrescriptions()
    detectLocation()
  }, [])

  /* Auto-detect location */
  async function detectLocation() {
    const cached = localStorage.getItem('curelex_location')

    if (cached) {
      setUserLocation({ city: cached, loading: false })
    } else {
      setUserLocation({ city: 'Detecting...', loading: true })
    }

    // Try multiple APIs in sequence — all HTTPS + CORS-open
    const APIs = [
      async () => {
        // ipwho.is — free, HTTPS, CORS open
        const r = await fetch('https://ipwho.is/')
        const d = await r.json()
        console.log('[Location] ipwho.is:', d)
        if (d.success && d.city) return d.city
      },
      async () => {
        // geojs.io — free, HTTPS, CORS open
        const r = await fetch('https://get.geojs.io/v1/ip/geo.json')
        const d = await r.json()
        console.log('[Location] geojs.io:', d)
        if (d.city) return d.city
        if (d.region) return d.region
      },
      async () => {
        // ipapi.co — free tier, HTTPS, CORS open
        const r = await fetch('https://ipapi.co/json/')
        const d = await r.json()
        console.log('[Location] ipapi.co:', d)
        if (d.city) return d.city
      },
      async () => {
        // ip-api.com via HTTPS
        const r = await fetch('https://pro.ip-api.com/json?fields=city,regionName,status')
        const d = await r.json()
        console.log('[Location] ip-api.com:', d)
        if (d.status === 'success' && d.city) return d.city
      },
    ]

    for (const apiFn of APIs) {
      try {
        const city = await apiFn()
        if (city) {
          console.log('[Location] Resolved city:', city)
          setUserLocation({ city, loading: false })
          localStorage.setItem('curelex_location', city)
          return
        }
      } catch (e) {
        console.warn('[Location] API failed:', e.message)
      }
    }

    // All failed — use cached or default
    setUserLocation({ city: cached || 'Set Location', loading: false })
  }

  /* ── close sidebar on resize ── */
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth > 768) setSidebarOpen(false) }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  /* ── data loaders ── */
  async function loadAppointments() {
    try {
      const res  = await fetch(`${API}/appointments/patient/${currentUser.id}`, { headers: authHeaders(token) })
      const data = await res.json()
      if (!data.success || !data.appointments?.length) return

      const all  = data.appointments
      const now  = new Date()
      const approved     = all.filter(a =>  a.doctorApproved && new Date(a.appointmentTime) > now && a.status === 'scheduled')
      const pending      = all.filter(a => !a.doctorApproved && new Date(a.appointmentTime) > now && a.status === 'scheduled')
      const expired      = all.filter(a => !a.doctorApproved && new Date(a.appointmentTime) <= now)
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

  /* ── handlers ── */
  const handleLogout = () => {
    localStorage.removeItem('curelex_location') // clear cached location on logout
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

  const now = new Date()

  /* ── initials from name ── */
  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  /* ══════════════════════════════════════
     RENDER
     ══════════════════════════════════════ */
  return (
    <div className="pd-layout">

      {/* ════════════════════════
          TOPBAR — full width
          ════════════════════════ */}
      <header className="pd-topbar">
        <Link to="/" className="logo">
          <img className="logo-img" src="/assets/logo.png" alt="CURELEX" />
        </Link>

        <div className="pd-topbar__right">
          {/* Location chip — auto-detected */}
          <div
            className="pd-topbar__location"
            title="Click to refresh location"
            onClick={detectLocation}
            style={{ cursor: 'pointer' }}
          >
            <i className={`fas ${userLocation.loading ? 'fa-spinner fa-spin' : 'fa-map-marker-alt'}`}></i>
            {userLocation.city}
            {!userLocation.loading && (
              <i className="fas fa-chevron-down" style={{ fontSize: 10 }}></i>
            )}
          </div>

          {/* Search */}
          <div className="pd-topbar__search">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Search doctors, clinics, hospitals…" />
          </div>

          {/* User dropdown */}
          <div className="pd-user-menu">
            <div
              className="pd-user-menu__trigger"
              onClick={() => setUserDropdown(o => !o)}
            >
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
                          onClick={() => { setActiveNav(item.key); setUserDropdown(false) }}
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

      {/* Row: sidebar + main */}
      <div className="pd-below-header">

        {/* Sidebar overlay (mobile) */}
        <div
          className={`pd-sidebar-overlay${sidebarOpen ? ' visible' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* ════════════════════════
            SIDEBAR
            ════════════════════════ */}
        <aside className={`pd-sidebar${sidebarOpen ? ' open' : ''}`}>

          {/* Profile strip */}
          <div className="pd-sidebar__profile">
            <div className="pd-sidebar__avatar">{initials}</div>
            <div>
              <div className="pd-sidebar__name">{currentUser?.name || 'Patient'}</div>
              <div className="pd-sidebar__phone">{currentUser?.email || ''}</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="pd-sidebar__nav">
            {NAV_ITEMS.map((item, i) =>
              item.divider
                ? <div key={i} className="pd-nav-divider" />
                : (
                  <div
                    key={item.key}
                    className={`pd-nav-item${activeNav === item.key ? ' active' : ''}`}
                    onClick={() => { setActiveNav(item.key); setSidebarOpen(false) }}
                  >
                    <i className={`fas ${item.icon}`}></i>
                    {item.label}
                  </div>
                )
            )}
          </nav>

          {/* Footer – logout */}
          <div className="pd-sidebar__footer">
            <button className="pd-logout-btn" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </button>
          </div>
        </aside>

        {/* ════════════════════════
            MAIN
            ════════════════════════ */}
        <div className="pd-main">
          <main className="pd-body">

          {/* ── Quick Stats ── */}
          <div className="pd-stats">
            {[
              { icon: 'fa-calendar-check',       cls: '--blue',   num: stats.upcoming,      label: 'Upcoming Appointments' },
              { icon: 'fa-prescription-bottle',  cls: '--green',  num: stats.prescriptions, label: 'Prescriptions'         },
              { icon: 'fa-file-medical',         cls: '--orange', num: stats.total,         label: 'Total Appointments'    },
              { icon: 'fa-user-md',              cls: '--purple', num: stats.doctors,       label: 'Doctors Consulted'     },
            ].map(s => (
              <div className="pd-stat-card" key={s.label}>
                <div className={`pd-stat-card__icon pd-stat-card__icon${s.cls}`}>
                  <i className={`fas ${s.icon}`}></i>
                </div>
                <div>
                  <div className="pd-stat-card__num">{s.num}</div>
                  <div className="pd-stat-card__label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Our Offerings ── */}
          <div className="pd-offerings">
            <div className="pd-section-header">
              <div>
                <h2>Our Offerings</h2>
                <p>Everything you need for your health in one place</p>
              </div>
            </div>
            <div className="pd-offerings-grid">
              {OFFERINGS.map(o => (
                <div className="pd-offering-card" key={o.label}>
                  <div
                    className="pd-offering-card__icon"
                    style={{ background: o.color + '1a', color: o.color }}
                  >
                    <i className={`fas ${o.icon}`}></i>
                  </div>
                  <h4>{o.label}</h4>
                  <p>{o.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Consult Specialities */}
          <div className="consult-section-wrapper">
            <section className="consult-section">
              <div className="consult-header">
                <div>
                  <h2>Consult top doctors online for any health concern</h2>
                  <p>Private online consultations with verified doctors in all specialists</p>
                </div>
                <button className="btn-view-all">View All Specialities</button>
              </div>
              <div className="consult-grid">
                {[
                  { label: 'Period doubts or Pregnancy', icon: 'fa-venus', color: '#f9a8d4' },
                  { label: 'Acne, pimple or skin issues', icon: 'fa-face-meh', color: '#fcd34d' },
                  { label: 'Performance issues in bed', icon: 'fa-heart-pulse', color: '#f87171' },
                  { label: 'Cold, cough or fever', icon: 'fa-head-side-cough', color: '#93c5fd' },
                  { label: 'Child not feeling well', icon: 'fa-baby', color: '#86efac' },
                  { label: 'Depression or anxiety', icon: 'fa-brain', color: '#c4b5fd' },
                ].map((item, i) => (
                  <div className="consult-card" key={i}>
                    <div className="consult-img-wrap" style={{ background: item.color + '33' }}>
                      <i className={`fas ${item.icon}`} style={{ fontSize: 36, color: item.color }}></i>
                    </div>
                    <p>{item.label}</p>
                    <button className="consult-now-btn">CONSULT NOW</button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ── Dashboard Cards Grid ── */}
          <div className="pd-grid">

            {/* ── Upcoming Appointments ── */}
            <div className="pd-card">
              <div className="pd-card__head">
                <div className="pd-card__head-icon"><i className="fas fa-calendar-alt"></i></div>
                <h3>Upcoming Appointments</h3>
              </div>
              <div className="pd-card__body">
                {!appointments.approved.length && !appointments.pending.length && (
                  <div className="pd-empty">
                    <i className="fas fa-calendar-times"></i>
                    No upcoming appointments
                  </div>
                )}

                {appointments.approved.map((apt, i) => {
                  const d       = new Date(apt.appointmentTime)
                  const diffMin = (d - now) / 60000
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
                          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
                            Video link ready · available 30 min before
                          </p>
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
                    {appointments.expired.length} past request{appointments.expired.length > 1 ? 's' : ''} expired.
                    Please book a new appointment.
                  </div>
                )}
              </div>
              <div className="pd-card__footer">
                <button className="pd-btn pd-btn--primary pd-btn--full" onClick={() => setAppointmentModal(true)}>
                  <i className="fas fa-calendar-plus"></i> Book New Appointment
                </button>
              </div>
            </div>

            {/* ── Prescriptions ── */}
            <div className="pd-card">
              <div className="pd-card__head">
                <div className="pd-card__head-icon"><i className="fas fa-prescription-bottle-alt"></i></div>
                <h3>Past Prescriptions</h3>
              </div>
              <div className="pd-card__body">
                {prescriptions.length === 0 && (
                  <div className="pd-empty">
                    <i className="fas fa-file-prescription"></i>
                    No prescriptions yet
                  </div>
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
                      <button className="pd-btn pd-btn--outline pd-btn--sm" onClick={() => setViewPrescription(p)}>
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Current Symptoms ── */}
            <div className="pd-card">
              <div className="pd-card__head">
                <div className="pd-card__head-icon"><i className="fas fa-thermometer-half"></i></div>
                <h3>Current Symptoms</h3>
              </div>
              <div className="pd-card__body">
                {[
                  { name: 'Fever & Cold', date: 'Jan 15, 2024', status: 'pending' },
                  { name: 'Headache',     date: 'Jan 14, 2024', status: 'resolved' },
                ].map(s => (
                  <div className="pd-symptom-item" key={s.name}>
                    <div className={`pd-symptom-dot pd-symptom-dot--${s.status}`}></div>
                    <div className="pd-symptom-info">
                      <h4>{s.name}</h4>
                      <p>Reported: {s.date}</p>
                    </div>
                    <span className={`badge ${s.status === 'pending' ? 'badge--yellow' : 'badge--green'}`}>
                      {s.status === 'pending' ? 'Under Review' : 'Resolved'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pd-card__footer">
                <button className="pd-btn pd-btn--outline pd-btn--full">
                  <i className="fas fa-plus"></i> Report New Symptom
                </button>
              </div>
            </div>

            {/* ── Follow-up History ── */}
            <div className="pd-card">
              <div className="pd-card__head">
                <div className="pd-card__head-icon"><i className="fas fa-history"></i></div>
                <h3>Follow-Up History</h3>
              </div>
              <div className="pd-card__body">
                <div className="pd-timeline">
                  {HISTORY.map((item, i) => (
                    <div className="pd-timeline-item" key={i}>
                      <h4>{item.title}</h4>
                      <p>{item.date}</p>
                      <span className="doctor">{item.doctor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Current Follow-Up Status (full width) ── */}
            <div className="pd-card pd-card--wide">
              <div className="pd-card__head">
                <div className="pd-card__head-icon"><i className="fas fa-calendar-check"></i></div>
                <h3>Current Follow-Up Status</h3>
              </div>
              <div className="pd-card__body">
                <div className="pd-followup-progress">
                  {PROGRESS_STEPS.map((label, i) => (
                    <div
                      key={label}
                      className={`pd-progress-step${i < 3 ? (i < 2 ? ' done' : ' active') : ''}`}
                    >
                      <div className="pd-progress-step__dot">
                        <i className={`fas ${i < 2 ? 'fa-check' : 'fa-circle'}`}></i>
                      </div>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <div className="pd-followup-details">
                  {FOLLOWUP_DETAILS.map(d => (
                    <div className="pd-detail-row" key={d.label}>
                      <i className={`fas ${d.icon}`}></i>
                      <div>
                        <strong>{d.label}</strong>
                        <span>{d.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Medical Records (full width) ── */}
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
                      <h4>{r.title}</h4>
                      <p>{r.date}</p>
                      <button className="pd-btn pd-btn--outline pd-btn--sm">Download</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>{/* end pd-grid */}
        </main>
        </div>{/* end pd-main */}
      </div>{/* end pd-below-header */}

      {/* ════════════════════════
          APPOINTMENT MODAL
          ════════════════════════ */}
      {appointmentModal && (
        <div className="pd-modal-overlay" onClick={() => setAppointmentModal(false)}>
          <div className="pd-modal" onClick={e => e.stopPropagation()}>
            <div className="pd-modal__head" style={{ position: 'relative' }}>
              <button
                className="pd-modal__close"
                onClick={() => setAppointmentModal(false)}
                style={{ position: 'absolute', top: 14, right: 14 }}
              >
                <i className="fas fa-times"></i>
              </button>
              <div className="pd-modal__head-icon">
                <i className="fas fa-calendar-plus"></i>
              </div>
              <h2>Book New Appointment</h2>
              <p>Choose your preferred consultation type</p>
            </div>
            <div className="pd-modal__body">
              <div className="pd-appt-option" onClick={() => handleAppointmentChoice('telemedicine')}>
                <div className="pd-appt-option__icon" style={{ background: '#e8effd', color: '#2d6be4' }}>
                  <i className="fas fa-video"></i>
                </div>
                <h3>Telemedicine</h3>
                <p>Online video consultation from home. Fast and convenient.</p>
                <button className="pd-btn pd-btn--primary pd-btn--full">Continue</button>
              </div>
              <div className="pd-appt-option" onClick={() => handleAppointmentChoice('eclinic')}>
                <div className="pd-appt-option__icon" style={{ background: '#e6f7f3', color: '#00b386' }}>
                  <i className="fas fa-clinic-medical"></i>
                </div>
                <h3>E-Clinic</h3>
                <p>Visit partner clinics for in-person consultation.</p>
                <button className="pd-btn pd-btn--green pd-btn--full">Continue</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── View Prescription Modal ── */}
      {viewPrescription && (
        <ViewPrescriptionModal
          prescription={viewPrescription}
          onClose={() => setViewPrescription(null)}
        />
      )}

      <Toast />
    </div>
  )
}