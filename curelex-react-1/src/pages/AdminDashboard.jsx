// src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://localhost:5000/api'

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
})

export default function AdminDashboard() {
  const navigate = useNavigate()

  const [token,     setToken]    = useState(() => localStorage.getItem('admin-token') || '')
  const [authed,    setAuthed]   = useState(() => !!localStorage.getItem('admin-token'))
  const [email,     setEmail]    = useState('')
  const [password,  setPassword] = useState('')
  const [loginErr,  setLoginErr] = useState('')
  const [loginLoad, setLoginLoad]= useState(false)

  const [doctors,  setDoctors]  = useState([])
  const [loading,  setLoading]  = useState(false)
  const [tab,      setTab]      = useState('pending')
  const [search,   setSearch]   = useState('')
  const [toast,    setToast]    = useState(null)
  const [viewDoc,  setViewDoc]  = useState(null)

  useEffect(() => {
    if (authed && token) loadDoctors()
  }, [authed, token])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoginErr('')
    setLoginLoad(true)
    try {
      const res  = await fetch(`${API}/users/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (data.token && data.user?.role === 'admin') {
        localStorage.setItem('admin-token', data.token)
        setToken(data.token)
        setAuthed(true)
        setLoginErr('')
      } else if (data.token && data.user?.role !== 'admin') {
        setLoginErr('This account does not have admin privileges.')
      } else {
        setLoginErr(data.message || 'Invalid credentials.')
      }
    } catch {
      setLoginErr('Server error. Make sure backend is running.')
    } finally {
      setLoginLoad(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('admin-token')
    setToken('')
    setAuthed(false)
    setDoctors([])
  }

  async function loadDoctors() {
    setLoading(true)
    try {
      const res  = await fetch(`${API}/doctors`, { headers: authHeaders(token) })
      const data = await res.json()
      setDoctors(data.doctors || [])
    } catch {
      showToast('Failed to load doctors', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function approve(id) {
    try {
      const res  = await fetch(`${API}/admin/approve/${id}`, { method: 'POST', headers: authHeaders(token) })
      const data = await res.json()
      if (data.message === 'Doctor Approved' || data.doctor) {
        showToast('Doctor approved successfully ✅')
        setDoctors(prev => prev.map(d => d.id === id ? { ...d, verificationStatus: 'approved' } : d))
        if (viewDoc?.id === id) setViewDoc(v => ({ ...v, verificationStatus: 'approved' }))
      } else {
        showToast(data.message || 'Approval failed', 'error')
      }
    } catch {
      showToast('Server error during approval', 'error')
    }
  }

  async function reject(id) {
    try {
      const res  = await fetch(`${API}/admin/reject/${id}`, { method: 'POST', headers: authHeaders(token) })
      const data = await res.json()
      if (data.message === 'Doctor Rejected' || data.doctor) {
        showToast('Doctor rejected.', 'error')
        setDoctors(prev => prev.map(d => d.id === id ? { ...d, verificationStatus: 'rejected' } : d))
        if (viewDoc?.id === id) setViewDoc(v => ({ ...v, verificationStatus: 'rejected' }))
      } else {
        showToast(data.message || 'Rejection failed', 'error')
      }
    } catch {
      showToast('Server error during rejection', 'error')
    }
  }

  const filtered = doctors.filter(d => {
    const status = d.verificationStatus || 'pending'
    const matchTab =
      tab === 'pending'  ? status === 'pending'  :
      tab === 'approved' ? status === 'approved' :
      status === 'rejected'
    const matchSearch = !search ||
      (d.name  || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.specialization || '').toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const counts = {
    pending:  doctors.filter(d => (d.verificationStatus || 'pending') === 'pending').length,
    approved: doctors.filter(d => d.verificationStatus === 'approved').length,
    rejected: doctors.filter(d => d.verificationStatus === 'rejected').length,
  }

  // ── LOGIN SCREEN ──────────────────────────────────────────
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
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter admin password" required
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {loginErr && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
              <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}><i className="fas fa-exclamation-circle" style={{ marginRight: 6 }}></i>{loginErr}</p>
            </div>
          )}
          <button type="submit" disabled={loginLoad}
            style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: loginLoad ? 0.7 : 1 }}>
            {loginLoad ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div style={{ marginTop: 20, padding: 14, background: '#f0f9ff', borderRadius: 10, fontSize: 12, color: '#0369a1' }}>
          <strong>Admin credentials:</strong><br />Email: admin@curelex.com<br />Password: password
        </div>
      </div>
    </div>
  )

  // ── ADMIN PANEL ───────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: "'Poppins',sans-serif" }}>

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'error' ? '#ef4444' : '#10b981', color: 'white', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
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
          <button onClick={loadDoctors} style={{ background: 'none', border: '1px solid #e5e7eb', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
            <i className="fas fa-sync-alt" style={{ marginRight: 5 }}></i>Refresh
          </button>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: '1px solid #e5e7eb', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#374151' }}>← Home</button>
          <button onClick={handleLogout} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Logout</button>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Doctor Approvals</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>Review and approve doctor registrations</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Pending',  count: counts.pending,  color: '#f59e0b', bg: '#fffbeb', icon: 'fa-clock'        },
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
        {loading ? (
          <div style={{ background: 'white', borderRadius: 14, padding: '48px 20px', textAlign: 'center', color: '#6b7280' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: 32, marginBottom: 12, display: 'block', color: '#2563eb' }}></i>
            <p style={{ margin: 0 }}>Loading doctors from database...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 14, padding: '48px 20px', textAlign: 'center', color: '#9ca3af', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <i className="fas fa-user-md" style={{ fontSize: 40, marginBottom: 12, display: 'block' }}></i>
            <p style={{ margin: 0, fontSize: 15 }}>No {tab} doctors found</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {filtered.map(doc => {
              const status = doc.verificationStatus || 'pending'
              return (
                <div key={doc.id} style={{ background: 'white', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: doc.photoUrl ? 'transparent' : 'linear-gradient(135deg,#2563eb,#7c3aed)', backgroundImage: doc.photoUrl ? `url(${doc.photoUrl})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                    {!doc.photoUrl && (doc.name || 'D').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Dr. {doc.name}</h3>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, textTransform: 'uppercase',
                        background: status === 'approved' ? '#d1fae5' : status === 'rejected' ? '#fee2e2' : '#fef3c7',
                        color:      status === 'approved' ? '#065f46' : status === 'rejected' ? '#991b1b' : '#92400e',
                      }}>{status}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#6b7280' }}>
                      {doc.email          && <span><i className="fas fa-envelope"    style={{ marginRight: 5, color: '#2563eb' }}></i>{doc.email}</span>}
                      {doc.mobile         && <span><i className="fas fa-phone"        style={{ marginRight: 5, color: '#10b981' }}></i>{doc.mobile}</span>}
                      {doc.specialization && <span><i className="fas fa-stethoscope" style={{ marginRight: 5, color: '#7c3aed' }}></i>{doc.specialization}</span>}
                      {doc.experience     && <span><i className="fas fa-briefcase"   style={{ marginRight: 5, color: '#f59e0b' }}></i>{doc.experience}+ yrs</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                    <button onClick={() => setViewDoc(doc)} style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: 'white', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                      <i className="fas fa-eye" style={{ marginRight: 6 }}></i>View
                    </button>
                    {status !== 'approved' && (
                      <button onClick={() => approve(doc.id)} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        <i className="fas fa-check" style={{ marginRight: 6 }}></i>Approve
                      </button>
                    )}
                    {status !== 'rejected' && (
                      <button onClick={() => reject(doc.id)} style={{ background: '#f3f4f6', color: '#ef4444', border: '1.5px solid #fca5a5', borderRadius: 8, padding: '9px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        <i className="fas fa-times" style={{ marginRight: 6 }}></i>Reject
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ══ DOCTOR DETAIL MODAL — shows ALL fields from DB schema ══ */}
      {viewDoc && (
        <div onClick={() => setViewDoc(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(3px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.35)' }}>

            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', borderRadius: '20px 20px 0 0', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {viewDoc.photoUrl ? (
                  <img src={viewDoc.photoUrl} alt={viewDoc.name} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.4)' }} />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'white' }}>
                    {(viewDoc.name || 'D').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 style={{ margin: 0, color: 'white', fontSize: 20, fontWeight: 700 }}>Dr. {viewDoc.name}</h2>
                  <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                    {viewDoc.specialization || 'Specialization not set'} · {viewDoc.experience ? `${viewDoc.experience}+ yrs exp` : 'Experience not set'}
                  </p>
                  {/* Verification status badge */}
                  <span style={{
                    display: 'inline-block', marginTop: 6, fontSize: 11, fontWeight: 700,
                    padding: '2px 12px', borderRadius: 20, textTransform: 'uppercase',
                    background: viewDoc.verificationStatus === 'approved' ? '#d1fae5' : viewDoc.verificationStatus === 'rejected' ? '#fee2e2' : '#fef3c7',
                    color:      viewDoc.verificationStatus === 'approved' ? '#065f46' : viewDoc.verificationStatus === 'rejected' ? '#991b1b' : '#92400e',
                  }}>
                    {viewDoc.verificationStatus || 'pending'}
                  </span>
                </div>
              </div>
              <button onClick={() => setViewDoc(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', color: 'white', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>

            <div style={{ padding: '24px 28px' }}>

              {/* Section: Personal Information */}
              <SectionHeader icon="fa-user" label="Personal Information" color="#2563eb" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, marginBottom: 20 }}>
                <InfoRow label="Full Name"   value={viewDoc.name}                              icon="fa-id-card"       />
                <InfoRow label="Email"       value={viewDoc.email}                             icon="fa-envelope"      />
                <InfoRow label="Mobile"      value={viewDoc.mobile}                            icon="fa-phone"         />
                <InfoRow label="Age"         value={viewDoc.age ? `${viewDoc.age} years` : null} icon="fa-birthday-cake" />
                <InfoRow label="Gender"      value={viewDoc.gender}                            icon="fa-venus-mars"    capitalize />
              </div>

              {/* Section: Professional Details */}
              <SectionHeader icon="fa-stethoscope" label="Professional Details" color="#7c3aed" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, marginBottom: 20 }}>
                <InfoRow label="Specialization"    value={viewDoc.specialization}                                icon="fa-stethoscope"   />
                <InfoRow label="Experience"        value={viewDoc.experience ? `${viewDoc.experience}+ years` : null} icon="fa-briefcase-medical" />
                <InfoRow label="Patients Handled"  value={viewDoc.patientsHandeled != null ? viewDoc.patientsHandeled.toLocaleString() : null} icon="fa-users" />
                <InfoRow label="Reg. Number"       value={viewDoc.regNum}                                        icon="fa-id-badge"      />
                <InfoRow label="Reg. State"        value={viewDoc.regState}                                      icon="fa-map-marker-alt"/>
              </div>

              {/* Section: Documents */}
              <SectionHeader icon="fa-file-medical" label="Uploaded Documents" color="#0891b2" />
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
                {viewDoc.certificateUrl ? (
                  <a href={viewDoc.certificateUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 12, padding: '12px 18px', textDecoration: 'none', color: '#1d4ed8', fontWeight: 600, fontSize: 13, transition: 'all 0.18s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                    onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}
                  >
                    <i className="fas fa-file-certificate" style={{ fontSize: 20, color: '#2563eb' }}></i>
                    <div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Medical Certificate</div>
                      <div>View Document ↗</div>
                    </div>
                  </a>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '12px 18px', color: '#9ca3af', fontSize: 13 }}>
                    <i className="fas fa-file-times" style={{ fontSize: 20 }}></i>
                    <div>
                      <div style={{ fontSize: 12, marginBottom: 2 }}>Medical Certificate</div>
                      <div style={{ fontStyle: 'italic' }}>Not uploaded</div>
                    </div>
                  </div>
                )}

                {viewDoc.photoUrl && (
                  <a href={viewDoc.photoUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 12, padding: '12px 18px', textDecoration: 'none', color: '#16a34a', fontWeight: 600, fontSize: 13 }}
                  >
                    <i className="fas fa-image" style={{ fontSize: 20, color: '#10b981' }}></i>
                    <div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Profile Photo</div>
                      <div>View Photo ↗</div>
                    </div>
                  </a>
                )}
              </div>

              {/* Section: Account Info */}
              <SectionHeader icon="fa-cog" label="Account Information" color="#6b7280" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, marginBottom: 24 }}>
                <InfoRow label="Online Status"  value={viewDoc.isActive ? 'Active / Online' : 'Inactive / Offline'} icon="fa-circle" valueColor={viewDoc.isActive ? '#16a34a' : '#9ca3af'} />
                <InfoRow label="Registered On"  value={viewDoc.createdAt ? new Date(viewDoc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null} icon="fa-calendar-alt" />
                <InfoRow label="Last Updated"   value={viewDoc.updatedAt ? new Date(viewDoc.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null} icon="fa-clock" />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
                {viewDoc.verificationStatus !== 'approved' && (
                  <button onClick={() => { approve(viewDoc.id); setViewDoc(null) }}
                    style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', borderRadius: 10, padding: '11px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="fas fa-check"></i> Approve Doctor
                  </button>
                )}
                {viewDoc.verificationStatus !== 'rejected' && (
                  <button onClick={() => { reject(viewDoc.id); setViewDoc(null) }}
                    style={{ background: '#f3f4f6', color: '#ef4444', border: '1.5px solid #fca5a5', borderRadius: 10, padding: '11px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="fas fa-times"></i> Reject
                  </button>
                )}
                <button onClick={() => setViewDoc(null)}
                  style={{ background: 'none', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 10, padding: '11px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`* { font-family: 'Poppins', sans-serif; box-sizing: border-box; }`}</style>
    </div>
  )
}

/* ── Small helper components used only in the modal ── */

function SectionHeader({ icon, label, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 8, borderBottom: `2px solid ${color}22` }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className={`fas ${icon}`} style={{ fontSize: 13, color }}></i>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    </div>
  )
}

function InfoRow({ label, value, icon, capitalize, valueColor }) {
  if (value == null || value === '') return null
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid #f9fafb' }}>
      <i className={`fas ${icon}`} style={{ fontSize: 13, color: '#9ca3af', marginTop: 2, width: 16, flexShrink: 0 }}></i>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: valueColor || '#111827', textTransform: capitalize ? 'capitalize' : 'none', wordBreak: 'break-word' }}>{value}</div>
      </div>
    </div>
  )
}