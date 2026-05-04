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

  const [token,      setToken]     = useState(() => localStorage.getItem('admin-token') || '')
  const [authed,     setAuthed]    = useState(() => !!localStorage.getItem('admin-token'))
  const [email,      setEmail]     = useState('')
  const [password,   setPassword]  = useState('')
  const [loginErr,   setLoginErr]  = useState('')
  const [loginLoad,  setLoginLoad] = useState(false)

  const [doctors,        setDoctors]        = useState([])
  const [loading,        setLoading]        = useState(false)
  const [mainTab,        setMainTab]        = useState('doctors')   // 'doctors' | 'consultations'
  const [tab,            setTab]            = useState('pending')
  const [search,         setSearch]         = useState('')
  const [toast,          setToast]          = useState(null)
  const [viewDoc,        setViewDoc]        = useState(null)
  const [viewDocLoading, setViewDocLoading] = useState(false)

  // ── Fee modal state ──────────────────────────────────────────────
  const [feeModal,      setFeeModal]      = useState(null)
  const [feeInput,      setFeeInput]      = useState('')
  const [feeLoading,    setFeeLoading]    = useState(false)

  // ── Approve-with-fee modal state ─────────────────────────────────
  const [approveModal,  setApproveModal]  = useState(null)
  const [approveFee,    setApproveFee]    = useState('500')
  const [approveLoading,setApproveLoading]= useState(false)

  // ── Consultation Requests state ──────────────────────────────────
  const [consultations,      setConsultations]      = useState([])
  const [consultLoading,     setConsultLoading]     = useState(false)
  const [consultSearch,      setConsultSearch]      = useState('')
  const [consultFilter,      setConsultFilter]      = useState('all')  // 'all' | 'new' | 'contacted' | 'resolved'
  const [viewConsult,        setViewConsult]        = useState(null)
  const [consultNoteInput,   setConsultNoteInput]   = useState('')
  const [consultNoteLoading, setConsultNoteLoading] = useState(false)

  useEffect(() => {
    if (authed && token) {
      loadDoctors()
      loadConsultations()
    }
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (data.token && data.user?.role === 'admin') {
        localStorage.setItem('admin-token', data.token)
        setToken(data.token)
        setAuthed(true)
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
    setConsultations([])
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

  async function loadConsultations() {
    setConsultLoading(true)
    try {
      const res  = await fetch(`${API}/consultations`, { headers: authHeaders(token) })
      const data = await res.json()
      setConsultations(data.requests || [])
    } catch {
      showToast('Failed to load consultation requests', 'error')
    } finally {
      setConsultLoading(false)
    }
  }

  async function fetchAndViewDoc(doc) {
    setViewDoc(doc)
    setViewDocLoading(true)
    try {
      const res  = await fetch(`${API}/doctors/${doc.id}`, { headers: authHeaders(token) })
      const data = await res.json()
      if (data.doctor) setViewDoc(data.doctor)
    } catch {
      showToast('Failed to load doctor details', 'error')
    } finally {
      setViewDocLoading(false)
    }
  }

  function openApproveModal(id, name, existingFee) {
    setApproveModal({ id, name })
    setApproveFee(existingFee ? String(existingFee) : '500')
  }

  async function confirmApprove() {
    const fee = Number(approveFee)
    if (!approveFee || isNaN(fee) || fee < 0) {
      showToast('Please enter a valid consultation fee', 'error')
      return
    }
    setApproveLoading(true)
    try {
      const res  = await fetch(`${API}/admin/approve/${approveModal.id}`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ consultationFee: fee }),
      })
      const data = await res.json()
      if (data.message === 'Doctor Approved' || data.doctor) {
        showToast(`Dr. ${approveModal.name} approved ✅ — Fee set to ₹${fee}`)
        setDoctors(prev => prev.map(d =>
          d.id === approveModal.id
            ? { ...d, verificationStatus: 'approved', consultationFee: fee }
            : d
        ))
        if (viewDoc?.id === approveModal.id)
          setViewDoc(v => ({ ...v, verificationStatus: 'approved', consultationFee: fee }))
        setApproveModal(null)
        setViewDoc(null)
      } else {
        showToast(data.message || 'Approval failed', 'error')
      }
    } catch {
      showToast('Server error during approval', 'error')
    }
    setApproveLoading(false)
  }

  async function reject(id) {
    try {
      const res  = await fetch(`${API}/admin/reject/${id}`, { method: 'POST', headers: authHeaders(token) })
      const data = await res.json()
      if (data.message === 'Doctor Rejected' || data.doctor) {
        showToast('Doctor rejected.', 'error')
        setDoctors(prev => prev.map(d =>
          d.id === id ? { ...d, verificationStatus: 'rejected' } : d
        ))
        if (viewDoc?.id === id) setViewDoc(v => ({ ...v, verificationStatus: 'rejected' }))
      } else {
        showToast(data.message || 'Rejection failed', 'error')
      }
    } catch {
      showToast('Server error during rejection', 'error')
    }
  }

  async function confirmFeeUpdate() {
    const fee = Number(feeInput)
    if (!feeInput || isNaN(fee) || fee < 0) {
      showToast('Please enter a valid fee', 'error')
      return
    }
    setFeeLoading(true)
    try {
      const res  = await fetch(`${API}/admin/fee/${feeModal.id}`, {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify({ consultationFee: fee }),
      })
      const data = await res.json()
      if (data.success) {
        showToast(`Fee updated to ₹${fee} ✅`)
        setDoctors(prev => prev.map(d =>
          d.id === feeModal.id ? { ...d, consultationFee: fee } : d
        ))
        if (viewDoc?.id === feeModal.id)
          setViewDoc(v => ({ ...v, consultationFee: fee }))
        setFeeModal(null)
      } else {
        showToast(data.message || 'Fee update failed', 'error')
      }
    } catch {
      showToast('Server error', 'error')
    }
    setFeeLoading(false)
  }

  // ── Update consultation request status ───────────────────────────
  async function updateConsultStatus(id, status) {
    try {
      const res  = await fetch(`${API}/consultations/${id}`, {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (data.success) {
        showToast(`Marked as "${status}"`)
        setConsultations(prev => prev.map(c => c.id === id ? { ...c, status } : c))
        if (viewConsult?.id === id) setViewConsult(v => ({ ...v, status }))
      }
    } catch {
      showToast('Failed to update status', 'error')
    }
  }

  async function saveConsultNote() {
    setConsultNoteLoading(true)
    try {
      const res  = await fetch(`${API}/consultations/${viewConsult.id}`, {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify({ adminNote: consultNoteInput }),
      })
      const data = await res.json()
      if (data.success) {
        showToast('Note saved ✅')
        setConsultations(prev => prev.map(c =>
          c.id === viewConsult.id ? { ...c, adminNote: consultNoteInput } : c
        ))
        setViewConsult(v => ({ ...v, adminNote: consultNoteInput }))
      }
    } catch {
      showToast('Failed to save note', 'error')
    }
    setConsultNoteLoading(false)
  }

  async function deleteConsult(id) {
    if (!window.confirm('Delete this consultation request? This cannot be undone.')) return
    try {
      const res  = await fetch(`${API}/consultations/${id}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      })
      const data = await res.json()
      if (data.success) {
        showToast('Request deleted')
        setConsultations(prev => prev.filter(c => c.id !== id))
        setViewConsult(null)
      }
    } catch {
      showToast('Failed to delete request', 'error')
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

  const filteredConsultations = consultations.filter(c => {
    const matchFilter = consultFilter === 'all' || c.status === consultFilter
    const matchSearch = !consultSearch ||
      (c.fullName || '').toLowerCase().includes(consultSearch.toLowerCase()) ||
      (c.email    || '').toLowerCase().includes(consultSearch.toLowerCase()) ||
      (c.mobile   || '').toLowerCase().includes(consultSearch.toLowerCase()) ||
      (c.service  || '').toLowerCase().includes(consultSearch.toLowerCase()) ||
      (c.state    || '').toLowerCase().includes(consultSearch.toLowerCase())
    return matchFilter && matchSearch
  })

  const consultCounts = {
    all:       consultations.length,
    new:       consultations.filter(c => c.status === 'new').length,
    contacted: consultations.filter(c => c.status === 'contacted').length,
    resolved:  consultations.filter(c => c.status === 'resolved').length,
  }

  const statusStyle = (s) => ({
    new:       { bg: '#fef3c7', color: '#92400e', label: 'New' },
    contacted: { bg: '#dbeafe', color: '#1e40af', label: 'Contacted' },
    resolved:  { bg: '#d1fae5', color: '#065f46', label: 'Resolved' },
  }[s] || { bg: '#f3f4f6', color: '#374151', label: s })

  // ─────────────────────────── LOGIN SCREEN ──────────────────────
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

  // ─────────────────────────── ADMIN PANEL ──────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: "'Poppins',sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 99999, background: toast.type === 'error' ? '#ef4444' : '#10b981', color: 'white', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast.msg}
        </div>
      )}

      {/* ══ APPROVE WITH FEE MODAL ══ */}
      {approveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '32px 36px', width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 24, color: 'white' }}>
                <i className="fas fa-rupee-sign"></i>
              </div>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Set Consultation Fee</h3>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#6b7280' }}>Approving <strong>Dr. {approveModal.name}</strong></p>
            </div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Consultation Fee (₹) per session</label>
            <div style={{ position: 'relative', marginBottom: 24 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#6b7280', fontWeight: 700 }}>₹</span>
              <input type="number" min="0" step="50" value={approveFee} onChange={e => setApproveFee(e.target.value)} autoFocus
                style={{ width: '100%', padding: '12px 14px 12px 34px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 18, fontWeight: 700, outline: 'none', boxSizing: 'border-box', color: '#111827' }}
                onKeyDown={e => e.key === 'Enter' && confirmApprove()} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
              {[200, 300, 500, 700, 1000, 1500].map(amt => (
                <button key={amt} onClick={() => setApproveFee(String(amt))}
                  style={{ padding: '6px 14px', borderRadius: 20, border: '1.5px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    borderColor: approveFee === String(amt) ? '#10b981' : '#e5e7eb',
                    background:  approveFee === String(amt) ? '#f0fdf4' : 'white',
                    color:       approveFee === String(amt) ? '#059669' : '#374151' }}>
                  ₹{amt}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={confirmApprove} disabled={approveLoading}
                style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: approveLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <i className={`fas ${approveLoading ? 'fa-spinner fa-spin' : 'fa-check'}`}></i>
                {approveLoading ? 'Approving...' : `Approve at ₹${approveFee || '—'}`}
              </button>
              <button onClick={() => setApproveModal(null)}
                style={{ padding: '12px 20px', background: 'none', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ EDIT FEE MODAL ══ */}
      {feeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '32px 36px', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 22, color: 'white' }}>
                <i className="fas fa-edit"></i>
              </div>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>Update Consultation Fee</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Dr. {feeModal.name}</p>
            </div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>New Fee (₹)</label>
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#6b7280', fontWeight: 700 }}>₹</span>
              <input type="number" min="0" step="50" value={feeInput} onChange={e => setFeeInput(e.target.value)} autoFocus
                style={{ width: '100%', padding: '11px 14px 11px 34px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 18, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                onKeyDown={e => e.key === 'Enter' && confirmFeeUpdate()} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {[200, 300, 500, 700, 1000, 1500].map(amt => (
                <button key={amt} onClick={() => setFeeInput(String(amt))}
                  style={{ padding: '5px 12px', borderRadius: 20, border: '1.5px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    borderColor: feeInput === String(amt) ? '#2563eb' : '#e5e7eb',
                    background:  feeInput === String(amt) ? '#eff6ff' : 'white',
                    color:       feeInput === String(amt) ? '#1d4ed8' : '#374151' }}>
                  ₹{amt}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={confirmFeeUpdate} disabled={feeLoading}
                style={{ flex: 1, padding: '11px', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: feeLoading ? 0.7 : 1 }}>
                {feeLoading ? 'Saving...' : 'Save Fee'}
              </button>
              <button onClick={() => setFeeModal(null)}
                style={{ padding: '11px 18px', background: 'none', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ CONSULTATION REQUEST DETAIL MODAL ══ */}
      {viewConsult && (
        <div onClick={() => setViewConsult(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(3px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.35)' }}>
            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', borderRadius: '20px 20px 0 0', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'white', fontWeight: 700 }}>
                    {(viewConsult.fullName || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ margin: 0, color: 'white', fontSize: 18, fontWeight: 700 }}>{viewConsult.fullName}</h2>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: statusStyle(viewConsult.status).bg, color: statusStyle(viewConsult.status).color }}>
                        {statusStyle(viewConsult.status).label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={() => setViewConsult(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', color: 'white', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>

            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Contact Details */}
              <div style={{ background: '#f9fafb', borderRadius: 12, padding: '16px 20px', border: '1px solid #f0f0f0' }}>
                <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6b7280' }}>Contact Information</p>
                <div style={{ display: 'grid', gap: 12 }}>
                  <ContactRow icon="fa-user"         label="Full Name"   value={viewConsult.fullName} />
                  <ContactRow icon="fa-phone-alt"    label="Mobile"      value={`${viewConsult.phoneCode || '+91'} ${viewConsult.mobile}`} highlight />
                  <ContactRow icon="fa-envelope"     label="Email"       value={viewConsult.email} highlight />
                  <ContactRow icon="fa-map-marker-alt" label="State"     value={viewConsult.state} />
                  <ContactRow icon="fa-stethoscope"  label="Service"     value={viewConsult.service} />
                  <ContactRow icon="fa-clock"        label="Submitted"   value={viewConsult.createdAt ? new Date(viewConsult.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'} />
                </div>
              </div>

              {/* Status Controls */}
              <div>
                <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#374151' }}>Update Status</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['new', 'contacted', 'resolved'].map(s => (
                    <button key={s} onClick={() => updateConsultStatus(viewConsult.id, s)}
                      style={{ padding: '8px 18px', borderRadius: 8, border: '1.5px solid', fontWeight: 700, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize', transition: 'all .15s',
                        background: viewConsult.status === s ? statusStyle(s).bg : 'white',
                        color:      viewConsult.status === s ? statusStyle(s).color : '#6b7280',
                        borderColor:viewConsult.status === s ? statusStyle(s).color + '80' : '#e5e7eb' }}>
                      {s === 'new' ? '🆕 New' : s === 'contacted' ? '📞 Contacted' : '✅ Resolved'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Note */}
              <div>
                <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#374151' }}>Admin Note (internal)</p>
                <textarea
                  rows={3}
                  value={consultNoteInput}
                  onChange={e => setConsultNoteInput(e.target.value)}
                  placeholder="e.g. Called on 3rd May, scheduled callback for 5th..."
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'Poppins, sans-serif' }}
                />
                <button onClick={saveConsultNote} disabled={consultNoteLoading}
                  style={{ marginTop: 8, padding: '8px 20px', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: consultNoteLoading ? 0.7 : 1 }}>
                  {consultNoteLoading ? 'Saving...' : '💾 Save Note'}
                </button>
              </div>

              {/* Quick Contact Buttons */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 4, borderTop: '1px solid #f3f4f6' }}>
                <a href={`tel:${viewConsult.phoneCode || '+91'}${viewConsult.mobile}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 8, padding: '9px 16px', textDecoration: 'none', color: '#16a34a', fontWeight: 700, fontSize: 13 }}>
                  <i className="fas fa-phone"></i> Call Now
                </a>
                <a href={`mailto:${viewConsult.email}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 8, padding: '9px 16px', textDecoration: 'none', color: '#1d4ed8', fontWeight: 700, fontSize: 13 }}>
                  <i className="fas fa-envelope"></i> Send Email
                </a>
                <button onClick={() => deleteConsult(viewConsult.id)}
                  style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 8, padding: '9px 16px', color: '#ef4444', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  <i className="fas fa-trash"></i> Delete
                </button>
              </div>
            </div>
          </div>
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
          <button onClick={() => { loadDoctors(); loadConsultations() }} style={{ background: 'none', border: '1px solid #e5e7eb', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
            <i className="fas fa-sync-alt" style={{ marginRight: 5 }}></i>Refresh
          </button>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: '1px solid #e5e7eb', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#374151' }}>← Home</button>
          <button onClick={handleLogout} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Logout</button>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px' }}>

        {/* ── Main Tab Switcher ── */}
        <div style={{ display: 'flex', gap: 4, background: 'white', borderRadius: 14, padding: 6, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', width: 'fit-content' }}>
          <button onClick={() => setMainTab('doctors')}
            style={{ padding: '10px 24px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all .2s',
              background: mainTab === 'doctors' ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : 'transparent',
              color: mainTab === 'doctors' ? 'white' : '#6b7280' }}>
            <i className="fas fa-user-md" style={{ marginRight: 8 }}></i>
            Doctor Approvals
            {counts.pending > 0 && (
              <span style={{ marginLeft: 8, background: mainTab === 'doctors' ? 'rgba(255,255,255,0.3)' : '#fef3c7', color: mainTab === 'doctors' ? 'white' : '#92400e', fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 20 }}>{counts.pending}</span>
            )}
          </button>
          <button onClick={() => setMainTab('consultations')}
            style={{ padding: '10px 24px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all .2s',
              background: mainTab === 'consultations' ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : 'transparent',
              color: mainTab === 'consultations' ? 'white' : '#6b7280' }}>
            <i className="fas fa-comments" style={{ marginRight: 8 }}></i>
            Consultation Requests
            {consultCounts.new > 0 && (
              <span style={{ marginLeft: 8, background: mainTab === 'consultations' ? 'rgba(255,255,255,0.3)' : '#fef3c7', color: mainTab === 'consultations' ? 'white' : '#92400e', fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 20 }}>{consultCounts.new}</span>
            )}
          </button>
        </div>

        {/* ════════════ DOCTORS TAB ════════════ */}
        {mainTab === 'doctors' && (
          <>
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
                  <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, textTransform: 'capitalize', background: tab === t ? '#2563eb' : '#f3f4f6', color: tab === t ? 'white' : '#6b7280' }}>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Dr. {doc.name}</h3>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, textTransform: 'uppercase',
                            background: status === 'approved' ? '#d1fae5' : status === 'rejected' ? '#fee2e2' : '#fef3c7',
                            color:      status === 'approved' ? '#065f46' : status === 'rejected' ? '#991b1b' : '#92400e' }}>
                            {status}
                          </span>
                          {doc.consultationFee != null && (
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                              ₹{doc.consultationFee}/consult
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#6b7280' }}>
                          {doc.email          && <span><i className="fas fa-envelope"    style={{ marginRight: 5, color: '#2563eb' }}></i>{doc.email}</span>}
                          {doc.mobile         && <span><i className="fas fa-phone"        style={{ marginRight: 5, color: '#10b981' }}></i>{doc.mobile}</span>}
                          {doc.specialization && <span><i className="fas fa-stethoscope" style={{ marginRight: 5, color: '#7c3aed' }}></i>{doc.specialization}</span>}
                          {doc.experience     && <span><i className="fas fa-briefcase"   style={{ marginRight: 5, color: '#f59e0b' }}></i>{doc.experience}+ yrs</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                        <button onClick={() => fetchAndViewDoc(doc)} style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: 'white', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                          <i className="fas fa-eye" style={{ marginRight: 6 }}></i>View
                        </button>
                        {status !== 'approved' && (
                          <button onClick={() => openApproveModal(doc.id, doc.name, doc.consultationFee)} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                            <i className="fas fa-check" style={{ marginRight: 6 }}></i>Approve
                          </button>
                        )}
                        {status === 'approved' && (
                          <button onClick={() => { setFeeModal({ id: doc.id, name: doc.name }); setFeeInput(doc.consultationFee ? String(doc.consultationFee) : '500') }}
                            style={{ background: '#eff6ff', color: '#1d4ed8', border: '1.5px solid #bfdbfe', borderRadius: 8, padding: '9px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                            <i className="fas fa-rupee-sign" style={{ marginRight: 5 }}></i>Fee
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
          </>
        )}

        {/* ════════════ CONSULTATION REQUESTS TAB ════════════ */}
        {mainTab === 'consultations' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Consultation Requests</h1>
              <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>Leads submitted from the homepage — contact them to schedule appointments</p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Total',     count: consultCounts.all,       color: '#2563eb', bg: '#eff6ff', icon: 'fa-list' },
                { label: 'New',       count: consultCounts.new,       color: '#f59e0b', bg: '#fffbeb', icon: 'fa-bell' },
                { label: 'Contacted', count: consultCounts.contacted, color: '#3b82f6', bg: '#dbeafe', icon: 'fa-phone-alt' },
                { label: 'Resolved',  count: consultCounts.resolved,  color: '#10b981', bg: '#f0fdf4', icon: 'fa-check-circle' },
              ].map(s => (
                <div key={s.label} style={{ background: 'white', borderRadius: 14, padding: '16px 18px', border: `1.5px solid ${s.color}22`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, background: s.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: s.color, flexShrink: 0 }}>
                    <i className={`fas ${s.icon}`}></i>
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{s.count}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filter + Search */}
            <div style={{ background: 'white', borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { key: 'all',       label: `All (${consultCounts.all})` },
                  { key: 'new',       label: `🆕 New (${consultCounts.new})` },
                  { key: 'contacted', label: `📞 Contacted (${consultCounts.contacted})` },
                  { key: 'resolved',  label: `✅ Resolved (${consultCounts.resolved})` },
                ].map(f => (
                  <button key={f.key} onClick={() => setConsultFilter(f.key)}
                    style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                      background: consultFilter === f.key ? '#2563eb' : '#f3f4f6',
                      color:      consultFilter === f.key ? 'white'   : '#6b7280' }}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div style={{ position: 'relative' }}>
                <i className="fas fa-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
                <input value={consultSearch} onChange={e => setConsultSearch(e.target.value)} placeholder="Search by name, email, mobile..."
                  style={{ padding: '8px 12px 8px 32px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', width: 260 }} />
              </div>
            </div>

            {/* Consultation Cards */}
            {consultLoading ? (
              <div style={{ background: 'white', borderRadius: 14, padding: '48px 20px', textAlign: 'center', color: '#6b7280' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: 32, marginBottom: 12, display: 'block', color: '#2563eb' }}></i>
                <p style={{ margin: 0 }}>Loading consultation requests...</p>
              </div>
            ) : filteredConsultations.length === 0 ? (
              <div style={{ background: 'white', borderRadius: 14, padding: '48px 20px', textAlign: 'center', color: '#9ca3af', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <i className="fas fa-comments" style={{ fontSize: 40, marginBottom: 12, display: 'block' }}></i>
                <p style={{ margin: 0, fontSize: 15 }}>No consultation requests found</p>
                <p style={{ margin: '6px 0 0', fontSize: 13 }}>Requests submitted from the homepage will appear here</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {filteredConsultations.map(c => {
                  const ss = statusStyle(c.status)
                  return (
                    <div key={c.id} style={{ background: 'white', borderRadius: 14, padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                      {/* Avatar */}
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {(c.fullName || 'U')[0].toUpperCase()}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
                          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>{c.fullName}</h3>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: ss.bg, color: ss.color }}>{ss.label}</span>
                          <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: '#f3f4f6', color: '#6b7280' }}>
                            <i className="fas fa-stethoscope" style={{ marginRight: 4 }}></i>{c.service}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#6b7280' }}>
                          <span><i className="fas fa-phone-alt" style={{ marginRight: 5, color: '#10b981' }}></i>{c.phoneCode} {c.mobile}</span>
                          <span><i className="fas fa-envelope"  style={{ marginRight: 5, color: '#2563eb' }}></i>{c.email}</span>
                          <span><i className="fas fa-map-marker-alt" style={{ marginRight: 5, color: '#7c3aed' }}></i>{c.state}</span>
                          <span style={{ fontSize: 12, color: '#9ca3af' }}>
                            <i className="fas fa-clock" style={{ marginRight: 4 }}></i>
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </span>
                        </div>
                        {c.adminNote && (
                          <div style={{ marginTop: 6, fontSize: 12, color: '#7c3aed', background: '#faf5ff', padding: '4px 10px', borderRadius: 6, display: 'inline-block' }}>
                            <i className="fas fa-sticky-note" style={{ marginRight: 4 }}></i>{c.adminNote}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                        <button onClick={() => { setViewConsult(c); setConsultNoteInput(c.adminNote || '') }}
                          style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                          <i className="fas fa-eye" style={{ marginRight: 5 }}></i>View
                        </button>
                        {c.status === 'new' && (
                          <button onClick={() => updateConsultStatus(c.id, 'contacted')}
                            style={{ background: '#dbeafe', color: '#1e40af', border: '1.5px solid #bfdbfe', borderRadius: 8, padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                            <i className="fas fa-phone" style={{ marginRight: 5 }}></i>Mark Contacted
                          </button>
                        )}
                        {c.status === 'contacted' && (
                          <button onClick={() => updateConsultStatus(c.id, 'resolved')}
                            style={{ background: '#d1fae5', color: '#065f46', border: '1.5px solid #86efac', borderRadius: 8, padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                            <i className="fas fa-check" style={{ marginRight: 5 }}></i>Resolve
                          </button>
                        )}
                        <a href={`tel:${c.phoneCode}${c.mobile}`}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f0fdf4', color: '#16a34a', border: '1.5px solid #86efac', borderRadius: 8, padding: '8px 14px', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                          <i className="fas fa-phone-alt"></i>
                        </a>
                        <a href={`mailto:${c.email}`}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#eff6ff', color: '#1d4ed8', border: '1.5px solid #bfdbfe', borderRadius: 8, padding: '8px 14px', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                          <i className="fas fa-envelope"></i>
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ══ DOCTOR DETAIL MODAL ══ */}
      {viewDoc && (
        <div onClick={() => setViewDoc(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(3px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.35)' }}>
            <div style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', borderRadius: '20px 20px 0 0', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {viewDoc.photoUrl
                  ? <img src={viewDoc.photoUrl} alt={viewDoc.name} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.4)' }} />
                  : <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'white' }}>
                      {(viewDoc.name || 'D').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                }
                <div>
                  <h2 style={{ margin: 0, color: 'white', fontSize: 20, fontWeight: 700 }}>Dr. {viewDoc.name}</h2>
                  <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                    {viewDoc.specialization || '—'}{viewDoc.experience ? ` · ${viewDoc.experience}+ yrs exp` : ''}
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '2px 12px', borderRadius: 20, textTransform: 'uppercase',
                      background: viewDoc.verificationStatus === 'approved' ? '#d1fae5' : viewDoc.verificationStatus === 'rejected' ? '#fee2e2' : '#fef3c7',
                      color:      viewDoc.verificationStatus === 'approved' ? '#065f46' : viewDoc.verificationStatus === 'rejected' ? '#991b1b' : '#92400e' }}>
                      {viewDoc.verificationStatus || 'pending'}
                    </span>
                    {viewDoc.consultationFee != null && (
                      <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '2px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.25)', color: 'white' }}>
                        ₹{viewDoc.consultationFee}/consultation
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setViewDoc(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', color: 'white', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>

            {viewDocLoading && (
              <div style={{ background: '#eff6ff', borderBottom: '1px solid #bfdbfe', padding: '8px 28px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1d4ed8' }}>
                <i className="fas fa-spinner fa-spin"></i> Loading doctor details…
              </div>
            )}

            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <SectionBlock icon="fa-user" label="Basic Information" color="#2563eb">
                <InfoRow label="Full Name"      icon="fa-id-card"      value={viewDoc.name} />
                <InfoRow label="Email"          icon="fa-envelope"     value={viewDoc.email} />
                <InfoRow label="Mobile"         icon="fa-phone"        value={viewDoc.mobile} />
                <InfoRow label="Specialization" icon="fa-stethoscope"  value={viewDoc.specialization} />
                <InfoRow label="Registered On"  icon="fa-calendar-alt"
                  value={viewDoc.createdAt ? new Date(viewDoc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
              </SectionBlock>

              <SectionBlock icon="fa-briefcase-medical" label="Professional Experience" color="#7c3aed">
                <InfoRow label="Years of Experience"        icon="fa-briefcase"      value={viewDoc.experience ? `${viewDoc.experience} years` : null} />
                <InfoRow label="Qualification"              icon="fa-graduation-cap" value={viewDoc.qualification} />
                <InfoRow label="Current Practice Institute" icon="fa-hospital"       value={viewDoc.currentInstitute} />
              </SectionBlock>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>
                {viewDoc.verificationStatus !== 'approved' && (
                  <button onClick={() => { setViewDoc(null); openApproveModal(viewDoc.id, viewDoc.name, viewDoc.consultationFee) }}
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

// ── Helper sub-components ──────────────────────────────────────────
function SectionBlock({ icon, label, color, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: `2px solid ${color}22` }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`fas ${icon}`} style={{ fontSize: 13, color }}></i>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ background: '#f9fafb', borderRadius: 10, padding: '4px 16px', border: '1px solid #f0f0f0' }}>
        {children}
      </div>
    </div>
  )
}

function InfoRow({ label, value, icon, valueColor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
      <i className={`fas ${icon}`} style={{ fontSize: 13, color: '#9ca3af', marginTop: 2, width: 16, flexShrink: 0 }}></i>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, marginBottom: 2 }}>{label}</div>
        {(value != null && value !== '')
          ? <div style={{ fontSize: 13, fontWeight: 600, color: valueColor || '#111827', wordBreak: 'break-word' }}>{value}</div>
          : <div style={{ fontSize: 12, color: '#d1d5db', fontStyle: 'italic' }}>Not provided</div>
        }
      </div>
    </div>
  )
}

function ContactRow({ label, value, icon, highlight }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <i className={`fas ${icon}`} style={{ fontSize: 13, color: highlight ? '#2563eb' : '#9ca3af', width: 16, flexShrink: 0 }}></i>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: highlight ? 700 : 600, color: highlight ? '#111827' : '#374151' }}>{value || '—'}</div>
      </div>
    </div>
  )
}