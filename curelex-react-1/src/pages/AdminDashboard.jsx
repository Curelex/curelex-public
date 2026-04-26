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

  // ── on mount: check if already authed ─────────────────────
  useEffect(() => {
    if (localStorage.getItem('admin-authed') === 'true') setAuthed(true)
  }, [])

  // ── reload doctors whenever authed ────────────────────────
  useEffect(() => {
    if (authed) loadDoctors()
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

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        * { font-family: 'Poppins', sans-serif; box-sizing: border-box; }
      `}</style>
    </div>
  )
}