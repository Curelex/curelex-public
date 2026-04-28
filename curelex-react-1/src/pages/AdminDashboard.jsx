// src/pages/AdminDashboard.jsx
// ─────────────────────────────────────────────────────────────
// Simple Admin Panel — approve / reject doctor registrations
// Route: /admin  (add to your App.jsx routes)
// Admin login: admin@curelex.com / admin123
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const ADMIN_EMAIL    = 'admin@curelex.com'
const ADMIN_PASSWORD = 'admin123'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [authed,    setAuthed]    = useState(false)
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [loginErr,  setLoginErr]  = useState('')
  const [doctors,   setDoctors]   = useState([])
  const [tab,       setTab]       = useState('pending') // pending | approved | rejected
  const [search,    setSearch]    = useState('')
  const [toast,     setToast]     = useState(null)
  const [viewDoc,   setViewDoc]   = useState(null)  // doctor being viewed in modal

  // ── on mount: check if already authed ─────────────────────
  useEffect(() => {
    if (localStorage.getItem('admin-authed') === 'true') setAuthed(true)
  }, [])

  // ── reload doctors whenever authed ────────────────────────
  useEffect(() => {
    if (!authed) return
    loadDoctors()

    // Auto-refresh when doctor registers or updates profile (cross-tab sync)
    const onStorage = (e) => {
      if (e.key === 'curelex_doctors') loadDoctors()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [authed])

  function loadDoctors() {
    const raw = localStorage.getItem('curelex_doctors')
    setDoctors(raw ? JSON.parse(raw) : [])
  }

  function saveDoctors(list) {
    localStorage.setItem('curelex_doctors', JSON.stringify(list))
    setDoctors(list)
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── login ─────────────────────────────────────────────────
  function handleLogin(e) {
    e.preventDefault()
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem('admin-authed', 'true')
      setAuthed(true)
      setLoginErr('')
    } else {
      setLoginErr('Invalid admin credentials.')
    }
  }

  function handleLogout() {
    localStorage.removeItem('admin-authed')
    setAuthed(false)
  }

  // ── approve / reject ──────────────────────────────────────
  function approve(id) {
    const updated = doctors.map(d =>
      d.id === id ? { ...d, isApproved: true, status: 'approved' } : d
    )
    saveDoctors(updated)
    showToast('Doctor approved successfully ✅')
  }

  function reject(id) {
    const updated = doctors.map(d =>
      d.id === id ? { ...d, isApproved: false, status: 'rejected' } : d
    )
    saveDoctors(updated)
    showToast('Doctor rejected.', 'error')
  }

  function deleteDoctor(id) {
    if (!window.confirm('Delete this doctor permanently?')) return
    saveDoctors(doctors.filter(d => d.id !== id))
    showToast('Doctor deleted.', 'error')
  }

  // ── filter ────────────────────────────────────────────────
  const filtered = doctors.filter(d => {
    const matchTab =
      tab === 'pending'  ? (!d.status || d.status === 'pending') :
      tab === 'approved' ? d.status === 'approved' :
      d.status === 'rejected'
    const matchSearch = !search ||
      (d.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.specialization || '').toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const counts = {
    pending:  doctors.filter(d => !d.status || d.status === 'pending').length,
    approved: doctors.filter(d => d.status === 'approved').length,
    rejected: doctors.filter(d => d.status === 'rejected').length,
  }

  // ══════════════════════════════════════════════════════════
  // LOGIN SCREEN
  // ══════════════════════════════════════════════════════════
  if (!authed) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#1e40af,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Poppins',sans-serif" }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28, color: 'white' }}>
            <i className="fas fa-shield-alt"></i>
          </div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Admin Login</h2>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>Curelex Administration Panel</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@curelex.com" required
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="admin123" required
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {loginErr && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{loginErr}</p>}
          <button type="submit" style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            Sign In
          </button>
        </form>

        <div style={{ marginTop: 20, padding: 14, background: '#f0f9ff', borderRadius: 10, fontSize: 12, color: '#0369a1' }}>
          <strong>Demo credentials:</strong><br />
          Email: admin@curelex.com<br />
          Password: admin123
        </div>
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════
  // ADMIN PANEL
  // ══════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: "'Poppins',sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: 'white', padding: '12px 20px', borderRadius: 10,
          fontWeight: 600, fontSize: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          animation: 'slideIn 0.3s ease',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 16 }}>
            <i className="fas fa-heartbeat"></i>
          </div>
          <div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>CURELEX</span>
            <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8, background: '#f3f4f6', padding: '2px 8px', borderRadius: 20 }}>Admin Panel</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={loadDoctors}
            style={{ background: 'none', border: '1px solid #e5e7eb', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#374151' }}
          >
            <i className="fas fa-sync-alt" style={{ marginRight: 5 }}></i>Refresh
          </button>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: '1px solid #e5e7eb', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
            ← Home
          </button>
          <button onClick={handleLogout} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            Logout
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px' }}>

        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Doctor Approvals</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>Review and approve doctor registrations</p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Pending',  count: counts.pending,  color: '#f59e0b', bg: '#fffbeb', icon: 'fa-clock' },
            { label: 'Approved', count: counts.approved, color: '#10b981', bg: '#f0fdf4', icon: 'fa-check-circle' },
            { label: 'Rejected', count: counts.rejected, color: '#ef4444', bg: '#fef2f2', icon: 'fa-times-circle' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: 14, padding: '18px 20px', border: `1.5px solid ${s.color}22`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, background: s.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: s.color }}>
                <i className={`fas ${s.icon}`}></i>
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{s.count}</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{s.label} Doctors</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs + Search */}
        <div style={{ background: 'white', borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['pending', 'approved', 'rejected'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: 13, textTransform: 'capitalize',
                background: tab === t ? '#2563eb' : '#f3f4f6',
                color: tab === t ? 'white' : '#6b7280',
                transition: 'all 0.2s',
              }}>
                {t} ({counts[t]})
              </button>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search doctors..."
              style={{ padding: '8px 12px 8px 32px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', width: 220 }} />
          </div>
        </div>

        {/* Doctor Cards */}
        {filtered.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 14, padding: '48px 20px', textAlign: 'center', color: '#9ca3af', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <i className="fas fa-user-md" style={{ fontSize: 40, marginBottom: 12, display: 'block' }}></i>
            <p style={{ margin: 0, fontSize: 15 }}>No {tab} doctors found</p>
            {tab === 'pending' && doctors.length === 0 && (
              <p style={{ margin: '8px 0 0', fontSize: 13 }}>Doctors will appear here after they register on the app.</p>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {filtered.map(doc => (
              <div key={doc.id} style={{ background: 'white', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>

                {/* Avatar */}
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {(doc.name || 'D').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Dr. {doc.name}</h3>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, textTransform: 'uppercase',
                      background: doc.status === 'approved' ? '#d1fae5' : doc.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                      color: doc.status === 'approved' ? '#065f46' : doc.status === 'rejected' ? '#991b1b' : '#92400e',
                    }}>
                      {doc.status || 'Pending'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#6b7280' }}>
                    {doc.email && <span><i className="fas fa-envelope" style={{ marginRight: 5, color: '#2563eb' }}></i>{doc.email}</span>}
                    {doc.mobile && <span><i className="fas fa-phone" style={{ marginRight: 5, color: '#10b981' }}></i>{doc.mobile}</span>}
                    {doc.specialization && <span><i className="fas fa-stethoscope" style={{ marginRight: 5, color: '#7c3aed' }}></i>{doc.specialization}</span>}
                    {doc.experience && <span><i className="fas fa-briefcase" style={{ marginRight: 5, color: '#f59e0b' }}></i>{doc.experience} yrs exp.</span>}
                    {doc.regNumber && <span><i className="fas fa-id-card" style={{ marginRight: 5, color: '#6b7280' }}></i>Reg: {doc.regNumber}</span>}
                    {doc.hospital && <span><i className="fas fa-hospital" style={{ marginRight: 5, color: '#ef4444' }}></i>{doc.hospital}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>

                  {/* ── NEW: View Button ── */}
                  <button onClick={() => setViewDoc(doc)} style={{
                    background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: 'white',
                    border: 'none', borderRadius: 8, padding: '9px 20px',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <i className="fas fa-eye"></i> View
                  </button>

                  {(doc.status !== 'approved') && (
                    <button onClick={() => approve(doc.id)} style={{
                      background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white',
                      border: 'none', borderRadius: 8, padding: '9px 20px',
                      fontWeight: 700, fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <i className="fas fa-check"></i> Approve
                    </button>
                  )}
                  {(doc.status !== 'rejected') && (
                    <button onClick={() => reject(doc.id)} style={{
                      background: '#f3f4f6', color: '#ef4444',
                      border: '1.5px solid #fca5a5', borderRadius: 8, padding: '9px 20px',
                      fontWeight: 700, fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <i className="fas fa-times"></i> Reject
                    </button>
                  )}
                  <button onClick={() => deleteDoctor(doc.id)} style={{
                    background: 'none', color: '#9ca3af',
                    border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 12px',
                    cursor: 'pointer', fontSize: 13,
                  }} title="Delete">
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Console helper box */}
        <div style={{ marginTop: 32, background: '#1e1e2e', borderRadius: 14, padding: '20px 24px', color: '#a6e3a1' }}>
          <p style={{ margin: '0 0 10px', color: '#cdd6f4', fontSize: 13, fontWeight: 600 }}>
            <i className="fas fa-terminal" style={{ marginRight: 8 }}></i>
            Quick Approve via Browser Console (for testing)
          </p>
          <p style={{ margin: '0 0 6px', fontSize: 12, color: '#6c7086' }}>Open DevTools → Console and paste:</p>
          <code style={{ fontSize: 12, display: 'block', lineHeight: 1.8, color: '#a6e3a1' }}>
            {`const docs = JSON.parse(localStorage.getItem('curelex_doctors') || '[]');`}<br />
            {`docs.forEach(d => { d.isApproved = true; d.status = 'approved'; });`}<br />
            {`localStorage.setItem('curelex_doctors', JSON.stringify(docs));`}<br />
            {`console.log('✅ All doctors approved!');`}
          </code>
        </div>
      </div>
      {/* ══════════════════════════════════════════════════════════
          DOCTOR DETAIL MODAL
      ════════════════════════════════════════════════════════════ */}
      {viewDoc && (
        <div onClick={() => setViewDoc(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          zIndex: 10000, display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '20px', backdropFilter: 'blur(3px)',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: 20, width: '100%', maxWidth: 760,
            maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
            fontFamily: "'Poppins',sans-serif",
          }}>

            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
              borderRadius: '20px 20px 0 0', padding: '24px 28px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {viewDoc.profilePhoto
                  ? <img src={viewDoc.profilePhoto} alt="Profile"
                      style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.4)' }} />
                  : <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'white' }}>
                      {(viewDoc.name || 'D').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                }
                <div>
                  <h2 style={{ margin: 0, color: 'white', fontSize: 20, fontWeight: 700 }}>Dr. {viewDoc.name}</h2>
                  <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>{viewDoc.specialization}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 20, textTransform: 'uppercase',
                  background: viewDoc.status === 'approved' ? '#d1fae5' : viewDoc.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                  color: viewDoc.status === 'approved' ? '#065f46' : viewDoc.status === 'rejected' ? '#991b1b' : '#92400e',
                }}>
                  {viewDoc.status || 'Pending'}
                </span>
                <button onClick={() => setViewDoc(null)} style={{
                  background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
                  width: 32, height: 32, cursor: 'pointer', color: 'white', fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>×</button>
              </div>
            </div>

            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Section helper */}
              {(() => {
                const Section = ({ title, icon, children }) => (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'white' }}>
                        <i className={`fas ${icon}`}></i>
                      </div>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>{title}</h3>
                    </div>
                    <div style={{ background: '#f9fafb', borderRadius: 12, padding: '16px 20px', border: '1px solid #f0f0f0' }}>
                      {children}
                    </div>
                  </div>
                )

                const Row = ({ label, value, icon }) => (
                  <div style={{ display: 'flex', gap: 8, padding: '7px 0', borderBottom: '1px solid #f0f0f0', alignItems: 'flex-start' }}>
                    <span style={{ minWidth: 160, fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {icon && <i className={`fas ${icon}`} style={{ width: 14, color: '#9ca3af' }}></i>}
                      {label}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', wordBreak: 'break-all' }}>
                      {value || <span style={{ color: '#d1d5db', fontWeight: 400 }}>Not provided</span>}
                    </span>
                  </div>
                )

                return (
                  <>
                    {/* Basic Info */}
                    <Section title="Basic Information" icon="fa-user">
                      <Row label="Full Name"       icon="fa-user"        value={viewDoc.name} />
                      <Row label="Email"           icon="fa-envelope"    value={viewDoc.email} />
                      <Row label="Mobile"          icon="fa-phone"       value={viewDoc.mobile} />
                      <Row label="Specialization"  icon="fa-stethoscope" value={viewDoc.specialization} />
                      <Row label="Address"         icon="fa-map-marker-alt" value={viewDoc.address} />
                      <Row label="Registered On"   icon="fa-calendar"    value={viewDoc.createdAt ? new Date(viewDoc.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : null} />
                    </Section>

                    {/* Professional Info */}
                    <Section title="Professional Details" icon="fa-briefcase-medical">
                      <Row label="Experience"       icon="fa-briefcase"   value={viewDoc.experience ? `${viewDoc.experience} years` : null} />
                      <Row label="Qualification"    icon="fa-graduation-cap" value={viewDoc.qualification} />
                      <Row label="Current Hospital" icon="fa-hospital"    value={viewDoc.hospital || viewDoc.currentInstitute} />
                      <Row label="Reg. Number"      icon="fa-id-card"     value={viewDoc.regNumber} />
                    </Section>

                    {/* Documents */}
                    <Section title="Identity Documents" icon="fa-file-alt">
                      <Row label="Aadhaar Number"  icon="fa-id-badge"    value={viewDoc.aadhaar} />
                      <Row label="License Number"  icon="fa-certificate" value={viewDoc.regNumber} />
                      {viewDoc.regCertificate && (
                        <div style={{ marginTop: 12 }}>
                          <p style={{ margin: '0 0 8px', fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <i className="fas fa-file-medical" style={{ color: '#9ca3af' }}></i> Registration Certificate
                          </p>
                          {viewDoc.regCertificate.startsWith('data:image') ? (
                            <img src={viewDoc.regCertificate} alt="Registration Certificate"
                              style={{ maxWidth: '100%', borderRadius: 10, border: '1px solid #e5e7eb', maxHeight: 320, objectFit: 'contain' }} />
                          ) : (
                            <a href={viewDoc.regCertificate} download="registration_certificate"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#2563eb', color: 'white', padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                              <i className="fas fa-download"></i> Download Certificate (PDF)
                            </a>
                          )}
                        </div>
                      )}
                    </Section>

                    {/* Bank Details */}
                    <Section title="Bank / Payment Details" icon="fa-university">
                      <Row label="Account Holder" icon="fa-user"        value={viewDoc.accountHolderName} />
                      <Row label="Bank Name"      icon="fa-building"    value={viewDoc.bankName} />
                      <Row label="Account Number" icon="fa-hashtag"     value={viewDoc.accountNumber} />
                      <Row label="IFSC Code"      icon="fa-code"        value={viewDoc.ifscCode} />
                    </Section>
                  </>
                )
              })()}

              {/* Modal Action Buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
                {viewDoc.status !== 'approved' && (
                  <button onClick={() => { approve(viewDoc.id); setViewDoc(null) }} style={{
                    background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white',
                    border: 'none', borderRadius: 10, padding: '11px 28px',
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <i className="fas fa-check"></i> Approve Doctor
                  </button>
                )}
                {viewDoc.status !== 'rejected' && (
                  <button onClick={() => { reject(viewDoc.id); setViewDoc(null) }} style={{
                    background: '#f3f4f6', color: '#ef4444',
                    border: '1.5px solid #fca5a5', borderRadius: 10, padding: '11px 28px',
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <i className="fas fa-times"></i> Reject
                  </button>
                )}
                <button onClick={() => setViewDoc(null)} style={{
                  background: 'none', color: '#6b7280',
                  border: '1px solid #e5e7eb', borderRadius: 10, padding: '11px 20px',
                  fontWeight: 600, fontSize: 14, cursor: 'pointer',
                }}>
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        * { font-family: 'Poppins', sans-serif; box-sizing: border-box; }
      `}</style>
    </div>
  )
}