// import { useState, useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '../context/AuthContext'
// import DashboardHeader from '../components/DashboardHeader'
// import { Toast, useToast } from '../components/Toast'
// import { API, authHeaders, formatDate, formatTime, timeAgoString } from '../utils/helpers'

// // ── Prescription Modal ────────────────────────────────────────────────────────
// function PrescriptionModal({ patientId, doctorId, token, onClose, onSuccess }) {
//   const [allMedicines, setAllMedicines] = useState([])
//   const [selected, setSelected] = useState([])
//   const [search, setSearch] = useState('')
//   const [dropdown, setDropdown] = useState([])
//   const [notes, setNotes] = useState('')
//   const showToast = useToast()

//   useEffect(() => {
//     fetch(`${API}/medicines/all`, { headers: authHeaders(token) })
//       .then(r => r.json())
//       .then(d => setAllMedicines(Array.isArray(d) ? d : (d.medicines || [])))
//       .catch(() => {})
//   }, [])

//   const handleSearch = (val) => {
//     setSearch(val)
//     if (!val.trim()) { setDropdown([]); return }
//     const needle = val.toLowerCase()
//     setDropdown(
//       allMedicines.filter(m =>
//         (m.name || '').toLowerCase().includes(needle) ||
//         (m.composition || '').toLowerCase().includes(needle)
//       ).slice(0, 8)
//     )
//   }

//   const selectMedicine = (name) => {
//     if (selected.find(m => m.name === name)) { showToast(`${name} already added`, 'info'); return }
//     setSelected(s => [...s, { name, dosage: '', duration: '', frequency: 'Once daily' }])
//     setSearch('')
//     setDropdown([])
//   }

//   const updateField = (i, field, val) =>
//     setSelected(s => s.map((m, idx) => idx === i ? { ...m, [field]: val } : m))

//   const remove = (i) => setSelected(s => s.filter((_, idx) => idx !== i))

//   const submit = async () => {
//     if (!selected.length) { showToast('Add at least one medicine', 'error'); return }
//     const invalid = selected.find(m => !m.dosage || !m.duration)
//     if (invalid) { showToast(`Fill dosage & duration for ${invalid.name}`, 'error'); return }
//     try {
//       const res = await fetch(`${API}/prescriptions/add`, {
//         method: 'POST',
//         headers: authHeaders(token),
//         body: JSON.stringify({ patientId, doctorId, medicines: selected, notes }),
//       })
//       const data = await res.json()
//       if (data.success || data.message?.includes('success')) {
//         showToast('Prescription sent!', 'success')
//         onSuccess?.()
//         onClose()
//       } else {
//         showToast(data.message || 'Failed to send', 'error')
//       }
//     } catch { showToast('Server error', 'error') }
//   }

//   return (
//     <div className="modal active">
//       <div className="modal-overlay" onClick={onClose}></div>
//       <div className="modal-container" style={{ maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
//         <button className="modal-close" onClick={onClose}>&times;</button>
//         <div className="appointment-modal-header">
//           <i className="fas fa-prescription"></i>
//           <h2>Write Prescription</h2>
//           <p>Patient #{patientId}</p>
//         </div>
//         <div style={{ padding: '0 1.5rem' }}>
//           <label>Search Medicine</label>
//           <input type="text" placeholder="Type medicine name..." value={search}
//             onChange={e => handleSearch(e.target.value)}
//             style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, margin: '6px 0' }} />
//           {dropdown.length > 0 && (
//             <div style={{ border: '1px solid var(--border)', borderRadius: 8, maxHeight: 160, overflowY: 'auto', background: 'var(--card-bg)' }}>
//               {dropdown.map(m => (
//                 <div key={m.name} onClick={() => selectMedicine(m.name)}
//                   style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
//                   <strong>{m.name}</strong>
//                   <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}> · {m.dosageForm || ''}</span>
//                 </div>
//               ))}
//             </div>
//           )}

//           <div style={{ marginTop: '1rem' }}>
//             {selected.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No medicines added yet.</p>}
//             {selected.map((m, i) => (
//               <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10, marginBottom: 8 }}>
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                   <strong>{m.name}</strong>
//                   <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16 }}>
//                     <i className="fas fa-trash"></i>
//                   </button>
//                 </div>
//                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 8 }}>
//                   <div>
//                     <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Dosage</label>
//                     <input value={m.dosage} placeholder="e.g. 500mg" onChange={e => updateField(i, 'dosage', e.target.value)}
//                       style={{ width: '100%', padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }} />
//                   </div>
//                   <div>
//                     <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Frequency</label>
//                     <select value={m.frequency} onChange={e => updateField(i, 'frequency', e.target.value)}
//                       style={{ width: '100%', padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}>
//                       {['Once daily', 'Twice daily', 'Thrice daily', 'SOS', 'As needed'].map(opt => (
//                         <option key={opt}>{opt}</option>
//                       ))}
//                     </select>
//                   </div>
//                   <div>
//                     <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Duration</label>
//                     <input value={m.duration} placeholder="e.g. 5 days" onChange={e => updateField(i, 'duration', e.target.value)}
//                       style={{ width: '100%', padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }} />
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>

//           <label style={{ marginTop: '1rem', display: 'block' }}>Notes</label>
//           <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes..."
//             style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, resize: 'vertical' }}></textarea>

//           <button className="btn btn-primary btn-full" style={{ margin: '1rem 0' }} onClick={submit}>
//             <i className="fas fa-paper-plane"></i> Send Prescription
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }

// // ── Meeting Link Card ─────────────────────────────────────────────────────────
// function MeetingLinkCard({ link, appointment, onClose }) {
//   return (
//     <div style={{
//       position: 'fixed', bottom: 80, right: 24, zIndex: 9999,
//       background: 'white', border: '1px solid var(--border)',
//       borderRadius: 12, padding: 16, width: 320,
//       boxShadow: '0 4px 24px rgba(0,0,0,0.15)'
//     }}>
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
//         <strong style={{ fontSize: 14 }}>
//           <i className="fas fa-video" style={{ color: '#22c55e' }}></i> Meeting Ready
//         </strong>
//         <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>×</button>
//       </div>
//       <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
//         Patient #{appointment?.patientId} · {new Date(appointment?.appointmentTime).toLocaleString()}
//       </p>
//       <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 8,
//         padding: '8px 10px', fontSize: 11, wordBreak: 'break-all', marginBottom: 10, color: 'var(--text-secondary)' }}>
//         {link}
//       </div>
//       <div style={{ display: 'flex', gap: 8 }}>
//         <button className="btn btn-outline btn-sm" style={{ flex: 1 }}
//           onClick={() => navigator.clipboard.writeText(link)}>
//           <i className="fas fa-copy"></i> Copy
//         </button>
//         <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => window.open(link, '_blank')}>
//           <i className="fas fa-video"></i> Join Now
//         </button>
//       </div>
//     </div>
//   )
// }

// // ── Main Dashboard ────────────────────────────────────────────────────────────
// export default function DoctorDashboard() {
//   const { currentUser: doctor, token, logout } = useAuth()
//   const navigate = useNavigate()
//   const showToast = useToast()

//   const [profile, setProfile] = useState(null)
//   const [stats, setStats] = useState({ today: '-', total: '-', newMonth: '-', prescriptions: '-' })
//   const [schedule, setSchedule] = useState([])
//   const [recentPatients, setRecentPatients] = useState([])
//   const [pendingPrescriptions, setPendingPrescriptions] = useState([])
//   const [requests, setRequests] = useState([])
//   const [prescriptionModal, setPrescriptionModal] = useState(null)
//   const [meetingCard, setMeetingCard] = useState(null)

//   useEffect(() => {
//     if (!doctor) { navigate('/'); return }
//     loadProfile()
//     loadAllApproved()
//     loadPrescriptions()
//     loadRequests()
//   }, [])

//   async function loadProfile() {
//     try {
//       const res = await fetch(`${API}/doctors/${doctor.id}`, { headers: authHeaders(token) })
//       const data = await res.json()
//       setProfile(data.doctor || data)
//     } catch { setProfile(doctor) }
//   }

//   async function loadAllApproved() {
//     try {
//       const res = await fetch(`${API}/appointments/doctor/${doctor.id}`, { headers: authHeaders(token) })
//       const data = await res.json()
//       const approved = (data.appointments || []).filter(a => a.doctorApproved === true)

//       const now = new Date()
//       const todayStr = now.toDateString()
//       const todayCount = approved.filter(a => new Date(a.appointmentTime).toDateString() === todayStr).length
//       const uniquePatients = [...new Set(approved.map(a => a.patientId))].length
//       const newThisMonth = approved.filter(a => {
//         const d = new Date(a.createdAt)
//         return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
//       }).length

//       setStats(s => ({ ...s, today: todayCount, total: uniquePatients, newMonth: newThisMonth }))

//       // Today's schedule
//       setSchedule(
//         approved
//           .filter(a => new Date(a.appointmentTime).toDateString() === todayStr)
//           .sort((a, b) => new Date(a.appointmentTime) - new Date(b.appointmentTime))
//       )

//       // Recent patients (deduplicated)
//       const seen = new Map()
//       approved
//         .filter(a => a.doctorId === doctor.id)
//         .sort((a, b) => new Date(b.appointmentTime) - new Date(a.appointmentTime))
//         .forEach(a => { if (!seen.has(a.patientId)) seen.set(a.patientId, a) })
//       setRecentPatients([...seen.values()].slice(0, 5))
//     } catch (err) { console.error(err) }
//   }

//   async function loadPrescriptions() {
//     try {
//       const res = await fetch(`${API}/prescriptions/doctor/${doctor.id}`, { headers: authHeaders(token) })
//       const data = await res.json()
//       const all = data.prescriptions || data || []
//       setPendingPrescriptions(all.filter(p => p.status === 'pending'))
//       setStats(s => ({ ...s, prescriptions: all.length }))
//     } catch (err) { console.error(err) }
//   }

//   async function loadRequests() {
//     try {
//       const res = await fetch(`${API}/appointments/doctor/${doctor.id}/pending`, { headers: authHeaders(token) })
//       const data = await res.json()
//       setRequests(data.appointments || data || [])
//     } catch (err) { console.error(err) }
//   }

//   async function respondToRequest(id, action) {
//     try {
//       if (action === 'accepted') {
//         const res = await fetch(`${API}/appointments/${id}/approve`, { method: 'PATCH', headers: authHeaders(token) })
//         const data = await res.json()
//         if (data.success) {
//           showToast('Appointment approved ✅', 'success')
//           if (data.meetingLink) setMeetingCard({ link: data.meetingLink, appointment: data.appointment })
//           loadRequests()
//           loadAllApproved()
//         } else {
//           showToast(data.message || 'Approval failed', 'error')
//         }
//       } else {
//         const res = await fetch(`${API}/appointments/status/${id}`, {
//           method: 'PUT', headers: authHeaders(token),
//           body: JSON.stringify({ status: 'cancelled' }),
//         })
//         if (res.ok) { showToast('Request declined.', 'info'); loadRequests() }
//       }
//     } catch (err) { showToast('Server error: ' + err.message, 'error') }
//   }

//   const handleLogout = () => { logout(); navigate('/') }
//   const d = profile || doctor

//   return (
//     <div className="dashboard-page doctor-dashboard">
//       <DashboardHeader
//         backTo="/"
//         backLabel="Back to Home"
//         rightContent={
//           <>
//             <div className="header-logo" style={{ marginRight: 'auto' }}>
//               <i className="fas fa-heartbeat"></i> CURELEX
//             </div>
//             <span>Welcome, Dr. {d?.name}</span>
//             <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
//               <i className="fas fa-sign-out-alt"></i> Logout
//             </button>
//           </>
//         }
//       />

//       <main className="dashboard-main">
//         <div className="dashboard-welcome">
//           <h1>Doctor Dashboard</h1>
//           <p>Manage your patients and appointments</p>
//         </div>

//         {/* Quick Stats */}
//         <div className="quick-stats">
//           {[
//             { icon: 'fa-users', num: stats.total, label: 'Total Patients' },
//             { icon: 'fa-calendar-check', num: stats.today, label: "Today's Appointments" },
//             { icon: 'fa-user-plus', num: stats.newMonth, label: 'New Patients This Month' },
//             { icon: 'fa-prescription-bottle-alt', num: stats.prescriptions, label: 'Total Prescriptions' },
//           ].map(s => (
//             <div className="stat-card" key={s.label}>
//               <i className={`fas ${s.icon}`}></i>
//               <div className="stat-info">
//                 <span className="stat-number">{s.num}</span>
//                 <span className="stat-label">{s.label}</span>
//               </div>
//             </div>
//           ))}
//         </div>

//         <div className="dashboard-grid">
//           {/* Today's Schedule */}
//           <div className="dashboard-card full-width">
//             <div className="card-header">
//               <i className="fas fa-calendar-day"></i>
//               <h3>Today's Schedule</h3>
//             </div>
//             <div className="card-body">
//               <div className="schedule-timeline">
//                 {schedule.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No appointments scheduled for today.</p>}
//                 {schedule.map((appt, i) => {
//                   const aptTime = new Date(appt.appointmentTime)
//                   const diffMin = (aptTime - new Date()) / 60000
//                   const statusClass = diffMin < -30 ? 'completed' : diffMin <= 15 ? 'current' : 'upcoming'
//                   const label = { completed: 'Completed', current: 'Now', upcoming: 'Upcoming' }[statusClass]
//                   return (
//                     <div className={`schedule-item ${statusClass}`} key={i}>
//                       <div className="schedule-time">{formatTime(appt.appointmentTime)}</div>
//                       <div className="schedule-info">
//                         <h4>Patient #{appt.patientId}</h4>
//                         <p>{appt.symptoms || 'Consultation'}</p>
//                         <span className={`status ${statusClass}`}>{label}</span>
//                       </div>
//                       <div style={{ display: 'flex', gap: 6 }}>
//                         {appt.meetingLink && (
//                           <button className="btn btn-primary btn-sm" onClick={() => window.open(appt.meetingLink, '_blank')}>
//                             <i className="fas fa-video"></i> Join
//                           </button>
//                         )}
//                         <button className="btn btn-outline btn-sm"
//                           onClick={() => setPrescriptionModal({ patientId: appt.patientId, appointmentId: appt.id })}>
//                           <i className="fas fa-prescription"></i> Prescribe
//                         </button>
//                       </div>
//                     </div>
//                   )
//                 })}
//               </div>
//             </div>
//           </div>

//           {/* Recent Patients */}
//           <div className="dashboard-card">
//             <div className="card-header">
//               <i className="fas fa-user-injured"></i>
//               <h3>Recent Patients</h3>
//             </div>
//             <div className="card-body">
//               <div className="patients-list">
//                 {recentPatients.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No patients yet.</p>}
//                 {recentPatients.map((a, i) => (
//                   <div className="patient-item" key={i}>
//                     <div className="patient-avatar"><i className="fas fa-user"></i></div>
//                     <div className="patient-info">
//                       <h4>Patient #{a.patientId}</h4>
//                       <p>Last: {formatDate(a.appointmentTime)}</p>
//                     </div>
//                     <button className="btn btn-outline btn-sm"
//                       onClick={() => setPrescriptionModal({ patientId: a.patientId, appointmentId: null })}>
//                       Prescribe
//                     </button>
//                   </div>
//                 ))}
//               </div>
//               <button className="btn btn-primary btn-full" style={{ marginTop: '1rem' }}
//                 onClick={() => showToast('All patients view coming soon!', 'info')}>
//                 <i className="fas fa-users"></i> View All Patients
//               </button>
//             </div>
//           </div>

//           {/* Pending Prescriptions */}
//           <div className="dashboard-card">
//             <div className="card-header">
//               <i className="fas fa-prescription"></i>
//               <h3>Pending Prescriptions</h3>
//             </div>
//             <div className="card-body">
//               <div className="prescription-list">
//                 {pendingPrescriptions.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No pending prescriptions.</p>}
//                 {pendingPrescriptions.map((p, i) => (
//                   <div className="prescription-item pending" key={i}>
//                     <div className="prescription-icon"><i className="fas fa-clock"></i></div>
//                     <div className="prescription-info">
//                       <h4>{p.patientName || 'Patient'}</h4>
//                       <p>Pending since: {p.createdAt ? formatDate(p.createdAt) : 'N/A'}</p>
//                     </div>
//                     <button className="btn btn-primary btn-sm" onClick={() => showToast('Opening editor...', 'info')}>Write</button>
//                   </div>
//                 ))}
//               </div>
//               <button className="btn btn-primary btn-full" style={{ marginTop: '1rem' }}
//                 onClick={() => {
//                   const pid = window.prompt('Enter Patient ID:')
//                   if (pid) setPrescriptionModal({ patientId: parseInt(pid), appointmentId: null })
//                 }}>
//                 <i className="fas fa-plus"></i> Write New Prescription
//               </button>
//             </div>
//           </div>

//           {/* Patient Requests */}
//           <div className="dashboard-card">
//             <div className="card-header">
//               <i className="fas fa-user-plus"></i>
//               <h3>New Patient Requests</h3>
//             </div>
//             <div className="card-body">
//               <div className="request-list">
//                 {requests.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No new patient requests.</p>}
//                 {requests.map((r, i) => (
//                   <div className="request-item" key={i}>
//                     <div className="request-avatar"><i className="fas fa-user"></i></div>
//                     <div className="request-info">
//                       <h4>{r.patientName || r.patient?.name || 'Patient'}</h4>
//                       <p>{r.type || r.reason || 'Consultation'}</p>
//                       <span className="request-time">Requested: {r.createdAt ? timeAgoString(r.createdAt) : 'Recently'}</span>
//                     </div>
//                     <div className="request-actions">
//                       <button className="btn btn-primary btn-sm" title="Accept"
//                         onClick={() => respondToRequest(r._id || r.id, 'accepted')}>
//                         <i className="fas fa-check"></i>
//                       </button>
//                       <button className="btn btn-outline btn-sm" title="Reject"
//                         onClick={() => respondToRequest(r._id || r.id, 'rejected')}>
//                         <i className="fas fa-times"></i>
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Doctor Profile */}
//           <div className="dashboard-card">
//             <div className="card-header">
//               <i className="fas fa-user-md"></i>
//               <h3>Your Profile</h3>
//             </div>
//             <div className="card-body">
//               <div className="profile-summary">
//                 <div className="profile-avatar-large"><i className="fas fa-user-md"></i></div>
//                 <div className="profile-details">
//                   <h4>Dr. {d?.name || '-'}</h4>
//                   <p className="specialization">{d?.specialization || '-'}</p>
//                   <p className="hospital"><i className="fas fa-hospital"></i> {d?.regState || d?.hospital || 'N/A'}</p>
//                   <div className="profile-stats">
//                     <div>
//                       <span className="number">{(d?.experience ?? '-') + '+'}</span>
//                       <span className="label">Years Exp.</span>
//                     </div>
//                     <div>
//                       <span className="number">{stats.total + '+'}</span>
//                       <span className="label">Patients</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//               <button className="btn btn-outline btn-full" onClick={() => showToast('Edit profile coming soon!', 'info')}>
//                 <i className="fas fa-edit"></i> Edit Profile
//               </button>
//             </div>
//           </div>

//           {/* Quick Actions */}
//           <div className="dashboard-card full-width">
//             <div className="card-header">
//               <i className="fas fa-bolt"></i>
//               <h3>Quick Actions</h3>
//             </div>
//             <div className="card-body">
//               <div className="quick-actions">
//                 {[
//                   { icon: 'fa-calendar-plus', label: 'Schedule Appointment' },
//                   { icon: 'fa-prescription-bottle-alt', label: 'Write Prescription' },
//                   { icon: 'fa-file-medical-alt', label: 'Create Medical Report' },
//                   { icon: 'fa-envelope', label: 'Send Message' },
//                   { icon: 'fa-video', label: 'Start Video Call' },
//                   { icon: 'fa-chart-bar', label: 'View Analytics' },
//                 ].map(a => (
//                   <button key={a.label} className="action-btn"
//                     onClick={() => showToast(`${a.label} coming soon!`, 'info')}>
//                     <i className={`fas ${a.icon}`}></i>
//                     <span>{a.label}</span>
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>
//       </main>

//       {prescriptionModal && (
//         <PrescriptionModal
//           patientId={prescriptionModal.patientId}
//           doctorId={doctor.id}
//           token={token}
//           onClose={() => setPrescriptionModal(null)}
//           onSuccess={loadPrescriptions}
//         />
//       )}

//       {meetingCard && (
//         <MeetingLinkCard
//           link={meetingCard.link}
//           appointment={meetingCard.appointment}
//           onClose={() => setMeetingCard(null)}
//         />
//       )}

//       <Toast />
//     </div>
//   )
// }
















import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import DashboardHeader from '../components/DashboardHeader'
import { Toast, useToast } from '../components/Toast'
import { API, authHeaders, formatDate, formatTime, timeAgoString } from '../utils/helpers'

// ── Prescription Modal ────────────────────────────────────────────────────────
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
      .catch(() => { })
  }, [])

  const handleSearch = (val) => {
    setSearch(val)
    if (!val.trim()) { setDropdown([]); return }
    const needle = val.toLowerCase()
    setDropdown(
      allMedicines.filter(m =>
        (m.name || '').toLowerCase().includes(needle) ||
        (m.composition || '').toLowerCase().includes(needle)
      ).slice(0, 8)
    )
  }

  const selectMedicine = (name) => {
    if (selected.find(m => m.name === name)) { showToast(`${name} already added`, 'info'); return }
    setSelected(s => [...s, { name, dosage: '', duration: '', frequency: 'Once daily' }])
    setSearch('')
    setDropdown([])
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
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ patientId, doctorId, medicines: selected, notes }),
      })
      const data = await res.json()
      if (data.success || data.message?.includes('success')) {
        showToast('Prescription sent!', 'success')
        onSuccess?.()
        onClose()
      } else {
        showToast(data.message || 'Failed to send', 'error')
      }
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
                      {['Once daily', 'Twice daily', 'Thrice daily', 'SOS', 'As needed'].map(opt => (
                        <option key={opt}>{opt}</option>
                      ))}
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

// ── Meeting Link Card ─────────────────────────────────────────────────────────
function MeetingLinkCard({ link, appointment, onClose }) {
  return (
    <div style={{
      position: 'fixed', bottom: 80, right: 24, zIndex: 9999,
      background: 'white', border: '1px solid var(--border)',
      borderRadius: 12, padding: 16, width: 320,
      boxShadow: '0 4px 24px rgba(0,0,0,0.15)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <strong style={{ fontSize: 14 }}>
          <i className="fas fa-video" style={{ color: '#22c55e' }}></i> Meeting Ready
        </strong>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>×</button>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
        Patient #{appointment?.patientId} · {new Date(appointment?.appointmentTime).toLocaleString()}
      </p>
      <div style={{
        background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 8,
        padding: '8px 10px', fontSize: 11, wordBreak: 'break-all', marginBottom: 10, color: 'var(--text-secondary)'
      }}>
        {link}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-outline btn-sm" style={{ flex: 1 }}
          onClick={() => navigator.clipboard.writeText(link)}>
          <i className="fas fa-copy"></i> Copy
        </button>
        <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => window.open(link, '_blank')}>
          <i className="fas fa-video"></i> Join Now
        </button>
      </div>
    </div>
  )
}

// ── Status Banner Component (replaces quick stats) ───────────────────────────
// ── Status Banner Component (replaces quick stats) ───────────────────────────
function StatusBanner({ status, onAction, profilePhoto, doctorName }) {
  if (status === 'complete') return null

  return (
    <>
      <div className="status-banner" style={{
        background: status === 'incomplete' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
        borderRadius: 16,
        padding: '1.5rem 2rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 48,
            height: 48,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
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
        <button
          className="btn"
          onClick={onAction}
          style={{
            background: 'white',
            color: status === 'incomplete' ? '#667eea' : '#f59e0b',
            border: 'none',
            padding: '10px 24px',
            fontWeight: 600
          }}
        >
          <i className={`fas ${status === 'incomplete' ? 'fa-arrow-right' : 'fa-sync-alt'}`}></i>
          {status === 'incomplete' ? ' Complete Profile' : ' Check Status'}
        </button>
      </div>

      {/* Profile image and name below the banner - only for pending status */}
      {status === 'pending' && profilePhoto && (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '1rem',
      padding: '1rem 1.5rem',
      background: 'white',
      borderRadius: '12px',
      marginBottom: '2rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      border: '1px solid var(--border)'
    }}
  >
    <div style={{ flex: '1 1 250px' }}>
      <div
        style={{
          fontWeight: 600,
          fontSize: 'clamp(14px, 2vw, 16px)',
          color: '#333'
        }}
      >
        Good Evening
      </div>

      <div
        style={{
          fontWeight: 600,
          fontSize: 'clamp(24px, 5vw, 42px)',
          color: '#333',
          wordBreak: 'break-word'
        }}
      >
        Dr. {doctorName || 'Doctor'}
      </div>

      <div
        style={{
          fontSize: 'clamp(12px, 2vw, 14px)',
          color: '#666'
        }}
      >
        Profile submitted • Awaiting verification
      </div>
    </div>

    <div
      style={{
        width: 'clamp(90px, 20vw, 150px)',
        height: 'clamp(90px, 20vw, 150px)',
        borderRadius: '50%',
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        flexShrink: 0,
        margin: '0 auto'
      }}
    >
      <img
        src={profilePhoto}
        alt="Profile"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
    </div>
  </div>
)}
    </>
  )
}
// ── Patient Incoming Banner ───────────────────────────────────────────────────
function PatientIncomingBanner({ requests, onAccept, onReject }) {
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [preference, setPreference] = useState('')

  if (!requests || requests.length === 0) return null

  // Show the first/most recent request as a banner
  const patient = requests[0]

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%)',
      borderRadius: 16,
      padding: '20px 24px',
      marginBottom: 24,
      color: 'white',
      boxShadow: '0 4px 20px rgba(37,99,235,0.3)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', top: -20, right: -20, width: 120, height: 120,
        borderRadius: '50%', background: 'rgba(255,255,255,0.08)'
      }} />
      <div style={{
        position: 'absolute', bottom: -30, right: 60, width: 80, height: 80,
        borderRadius: '50%', background: 'rgba(255,255,255,0.05)'
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        {/* Pulse icon */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>
            <i className="fas fa-user-injured"></i>
          </div>
          <div style={{
            position: 'absolute', top: 0, left: 0, width: 52, height: 52,
            borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)',
            animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
          }} />
        </div>

        {/* Patient info */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              background: '#fbbf24', color: '#78350f',
              fontSize: 10, fontWeight: 700, padding: '2px 8px',
              borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.5
            }}>New Patient</span>
            <span style={{ fontSize: 12, opacity: 0.8 }}>
              {patient.createdAt ? timeAgoString(patient.createdAt) : 'Just now'}
            </span>
          </div>

          <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>
            {patient.patientName || patient.patient?.name || 'Patient'} arriving
          </h3>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, opacity: 0.9 }}>
            {patient.patient?.age && (
              <span><i className="fas fa-birthday-cake" style={{ marginRight: 4 }}></i>{patient.patient.age} yrs</span>
            )}
            {(patient.symptoms || patient.reason) && (
              <span><i className="fas fa-stethoscope" style={{ marginRight: 4 }}></i>
                {patient.symptoms || patient.reason}
              </span>
            )}
            {(patient.type || patient.appointmentType) && (
              <span><i className="fas fa-tag" style={{ marginRight: 4 }}></i>
                {patient.type || patient.appointmentType}
              </span>
            )}
          </div>

          {/* Preference input */}
          <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="What do you prefer? (e.g. Video call, In-person...)"
              value={preference}
              onChange={e => setPreference(e.target.value)}
              style={{
                flex: 1, minWidth: 200,
                padding: '8px 14px', borderRadius: 8,
                border: '1.5px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.15)',
                color: 'white', fontSize: 13,
                outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.7)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.3)'}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => onAccept(patient._id || patient.id)}
            style={{
              background: 'white', color: '#1e40af',
              border: 'none', borderRadius: 8,
              padding: '10px 20px', fontWeight: 700,
              fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              transition: 'transform 0.1s',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <i className="fas fa-check"></i> Accept
          </button>
          <button
            onClick={() => onReject(patient._id || patient.id)}
            style={{
              background: 'rgba(255,255,255,0.15)', color: 'white',
              border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 8,
              padding: '10px 20px', fontWeight: 600,
              fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >
            <i className="fas fa-times"></i> Decline
          </button>
        </div>
      </div>

      {/* More patients badge */}
      {requests.length > 1 && (
        <div style={{
          marginTop: 12, paddingTop: 12,
          borderTop: '1px solid rgba(255,255,255,0.2)',
          fontSize: 12, opacity: 0.85,
        }}>
          <i className="fas fa-users" style={{ marginRight: 6 }}></i>
          +{requests.length - 1} more patient request{requests.length > 2 ? 's' : ''} waiting
        </div>
      )}

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const { currentUser: doctor, token, logout } = useAuth();
  const navigate = useNavigate()
  const showToast = useToast()

  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({ today: '-', total: '-', newMonth: '-', prescriptions: '-' })
  const [schedule, setSchedule] = useState([])
  const [recentPatients, setRecentPatients] = useState([])
  const [pendingPrescriptions, setPendingPrescriptions] = useState([])
  const [requests, setRequests] = useState([])
  const [prescriptionModal, setPrescriptionModal] = useState(null)
  const [meetingCard, setMeetingCard] = useState(null)
  const [profilePhoto, setProfilePhoto] = useState(null)

const [currentTime, setCurrentTime] = useState(new Date())
  useEffect(() => {
    // Load doctor data from localStorage
    const storedDoctorData = localStorage.getItem('doctor-data')
    if (storedDoctorData) {
      const data = JSON.parse(storedDoctorData)

      // Set profile photo if exists
      if (data.profilePhoto) {
        setProfilePhoto(data.profilePhoto)
      }
    }
  }, [])

  // Profile completion states
  const [profileStatus, setProfileStatus] = useState({
    isProfileComplete: false,
    isApproved: false,
    isLoading: true
  })

  useEffect(() => {
    if (!doctor) { navigate('/'); return }
    checkDoctorProfileStatus()
}, [])
  useEffect(() => {
    if (!doctor) { navigate('/'); return }
    loadProfile()
    loadAllApproved()
    loadPrescriptions()
    loadRequests()
    // Live clock
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  async function checkDoctorProfileStatus() {
    try {
      // First check localStorage for doctor data
      const storedDoctorData = localStorage.getItem('doctor-data')
      const storedProfileComplete = localStorage.getItem('doctor-profile-complete')
      const storedApproved = localStorage.getItem('doctor-approved')

      if (storedDoctorData) {
        const doctorData = JSON.parse(storedDoctorData)

        // Check if profile is complete
        const isComplete = doctorData &&
          doctorData.specialization &&
          doctorData.specialization !== '' &&
          doctorData.experience &&
          doctorData.experience !== '' &&
          doctorData.qualification &&
          doctorData.qualification !== '' &&
          doctorData.regNumber &&
          doctorData.regNumber !== ''

        // Check if profile is approved
        const isApproved = doctorData.isApproved === true

        setProfileStatus({
          isProfileComplete: isComplete,
          isApproved: isApproved,
          isLoading: false
        })

        // Load dashboard content if profile is complete AND approved
        if (isComplete && isApproved) {
          loadProfile()
          loadAllApproved()
          loadPrescriptions()
          loadRequests()
        }
      } else {
        // No stored doctor data
        setProfileStatus({
          isProfileComplete: false,
          isApproved: false,
          isLoading: false
        })
      }
    } catch (err) {
      console.error('Error checking profile status:', err)
      setProfileStatus({
        isProfileComplete: false,
        isApproved: false,
        isLoading: false
      })
    }
  }

  async function loadProfile() {
    try {
      // Try to fetch from API first
      const res = await fetch(`${API}/doctors/${doctor.id}`, { headers: authHeaders(token) })
      const data = await res.json()
      setProfile(data.doctor || data)
    } catch {
      // Fallback to localStorage
      const storedData = localStorage.getItem('doctor-data')
      if (storedData) {
        setProfile(JSON.parse(storedData))
      } else {
        setProfile(doctor)
      }
    }
  }

  async function loadAllApproved() {
    try {
      const res = await fetch(`${API}/appointments/doctor/${doctor.id}`, { headers: authHeaders(token) })
      const data = await res.json()
      const approved = (data.appointments || []).filter(a => a.doctorApproved === true)
      const now = new Date()
      const todayStr = now.toDateString()
      const todayCount = approved.filter(a => new Date(a.appointmentTime).toDateString() === todayStr).length
      const uniquePatients = [...new Set(approved.map(a => a.patientId))].length
      const newThisMonth = approved.filter(a => {
        const d = new Date(a.createdAt)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      }).length
      setStats(s => ({ ...s, today: todayCount, total: uniquePatients, newMonth: newThisMonth }))
      setSchedule(
        approved
          .filter(a => new Date(a.appointmentTime).toDateString() === todayStr)
          .sort((a, b) => new Date(a.appointmentTime) - new Date(b.appointmentTime))
      )
      const seen = new Map()
      approved
        .filter(a => a.doctorId === doctor.id)
        .sort((a, b) => new Date(b.appointmentTime) - new Date(a.appointmentTime))
        .forEach(a => { if (!seen.has(a.patientId)) seen.set(a.patientId, a) })
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
          loadRequests()
          loadAllApproved()
        } else {
          showToast(data.message || 'Approval failed', 'error')
        }
      } else {
        const res = await fetch(`${API}/appointments/status/${id}`, {
          method: 'PUT', headers: authHeaders(token),
          body: JSON.stringify({ status: 'cancelled' }),
        })
        if (res.ok) { showToast('Request declined.', 'info'); loadRequests() }
      }
    } catch (err) { showToast('Server error: ' + err.message, 'error') }
  }

  const handleCompleteProfile = () => {
    navigate('/doctor-profile')
  }

  const handleCheckStatus = () => {
    checkDoctorProfileStatus()
  }

  const handleLogout = () => { logout(); navigate('/') }
  const d = profile || doctor

  // Don't render dashboard content while checking status
  if (profileStatus.isLoading) {
    return (
      <div className="dashboard-page" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: 48, color: 'var(--primary)' }}></i>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  // Determine status banner type
  let bannerStatus = null
  if (!profileStatus.isProfileComplete) {
    bannerStatus = 'incomplete'
  } else if (!profileStatus.isApproved) {
    bannerStatus = 'pending'
  }

  const isContentVisible = profileStatus.isProfileComplete && profileStatus.isApproved
  // Greeting based on time
  const hour = currentTime.getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  // Doctor initials for avatar
  const initials = d?.name
    ? d.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'DR'

  return (
    <div className="dashboard-page doctor-dashboard">
      <DashboardHeader
        backTo="/"
        backLabel="Back to Home"
        rightContent={
          <>
            <div className="header-logo" style={{ marginRight: 'auto' }}>
              <i className="fas fa-heartbeat"></i> CURELEX
            </div>
            <span>Welcome, Dr. {d?.name || doctor?.name}</span>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </>
        }
      />

      <main className="dashboard-main">

        {/* ── Practo-style Welcome Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'white', borderRadius: 16, padding: '20px 28px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 24,
          border: '1px solid #f0f0f0', gap: 16, flexWrap: 'wrap',
        }}>
          {/* Left: greeting */}
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
              {greeting} 👋
            </p>
            <h1 style={{ margin: '4px 0 6px', fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 700, color: '#111827' }}>
              Hi, Dr. {d?.name || 'Doctor'}
            </h1>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#6b7280' }}>
              {d?.specialization && (
                <span><i className="fas fa-stethoscope" style={{ marginRight: 5, color: '#2563eb' }}></i>{d.specialization}</span>
              )}
              {d?.hospital && (
                <span><i className="fas fa-hospital" style={{ marginRight: 5, color: '#10b981' }}></i>{d.hospital}</span>
              )}
              <span>
                <i className="fas fa-clock" style={{ marginRight: 5, color: '#f59e0b' }}></i>
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                {' · '}
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>

          {/* Right: doctor avatar + quick status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right', display: 'none' }} className="dd-status-text">
              <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Status</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#10b981' }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10b981', marginRight: 5 }}></span>
                Available
              </p>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 700, color: 'white',
                boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                flexShrink: 0,
                // If doctor has a photo, show it
                ...(d?.photo ? {
                  backgroundImage: `url(${d.photo})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                } : {})
              }}>
                {!d?.photo && initials}
              </div>
              {/* Online dot */}
              <div style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 16, height: 16, borderRadius: '50%',
                background: '#10b981', border: '2.5px solid white',
              }} />
            </div>
          </div>
        </div>

        {/* Status Banner - replaces quick stats when profile not complete/approved */}
        {bannerStatus && (
          <StatusBanner
            status={bannerStatus}
            onAction={bannerStatus === 'incomplete' ? handleCompleteProfile : handleCheckStatus}
            profilePhoto={profilePhoto}
            doctorName={d?.name || doctor?.name}
          />
        )}
        {/* ── Patient Incoming Banner ── */}
        <PatientIncomingBanner
          requests={requests}
          onAccept={(id) => respondToRequest(id, 'accepted')}
          onReject={(id) => respondToRequest(id, 'rejected')}
        />

        {/* Quick Stats */}
        <div className="quick-stats">
          {[
            { icon: 'fa-users', num: stats.total, label: 'Total Patients', color: '#2563eb' },
            { icon: 'fa-calendar-check', num: stats.today, label: "Today's Appointments", color: '#10b981' },
            { icon: 'fa-user-plus', num: stats.newMonth, label: 'New Patients This Month', color: '#f59e0b' },
            { icon: 'fa-prescription-bottle-alt', num: stats.prescriptions, label: 'Total Prescriptions', color: '#7c3aed' },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <i className={`fas ${s.icon}`}></i>
              <div className="stat-info">
                <span className="stat-number">{s.num}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Only show dashboard content if profile is complete and approved */}
        {isContentVisible ? (
          <>
            {/* Quick Stats */}
            <div className="quick-stats">
              {[
                { icon: 'fa-users', num: stats.total, label: 'Total Patients' },
                { icon: 'fa-calendar-check', num: stats.today, label: "Today's Appointments" },
                { icon: 'fa-user-plus', num: stats.newMonth, label: 'New Patients This Month' },
                { icon: 'fa-prescription-bottle-alt', num: stats.prescriptions, label: 'Total Prescriptions' },
              ].map(s => (
                <div className="stat-card" key={s.label}>
                  <i className={`fas ${s.icon}`}></i>
                  <div className="stat-info">
                    <span className="stat-number">{s.num}</span>
                    <span className="stat-label">{s.label}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="dashboard-grid">
              {/* Today's Schedule */}
              <div className="dashboard-card full-width">
                <div className="card-header">
                  <i className="fas fa-calendar-day"></i>
                  <h3>Today's Schedule</h3>
                </div>
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
                            {appt.meetingLink && (
                              <button className="btn btn-primary btn-sm" onClick={() => window.open(appt.meetingLink, '_blank')}>
                                <i className="fas fa-video"></i> Join
                              </button>
                            )}
                            <button className="btn btn-outline btn-sm"
                              onClick={() => setPrescriptionModal({ patientId: appt.patientId, appointmentId: appt.id })}>
                              <i className="fas fa-prescription"></i> Prescribe
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Recent Patients */}
              <div className="dashboard-card">
                <div className="card-header">
                  <i className="fas fa-user-injured"></i>
                  <h3>Recent Patients</h3>
                </div>
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
                        <button className="btn btn-outline btn-sm"
                          onClick={() => setPrescriptionModal({ patientId: a.patientId, appointmentId: null })}>
                          Prescribe
                        </button>
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-primary btn-full" style={{ marginTop: '1rem' }}
                    onClick={() => showToast('All patients view coming soon!', 'info')}>
                    <i className="fas fa-users"></i> View All Patients
                  </button>
                </div>
              </div>

              {/* Pending Prescriptions */}
              <div className="dashboard-card">
                <div className="card-header">
                  <i className="fas fa-prescription"></i>
                  <h3>Pending Prescriptions</h3>
                </div>
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
                    onClick={() => {
                      const pid = window.prompt('Enter Patient ID:')
                      if (pid) setPrescriptionModal({ patientId: parseInt(pid), appointmentId: null })
                    }}>
                    <i className="fas fa-plus"></i> Write New Prescription
                  </button>
                </div>
              </div>

              {/* Patient Requests */}
              <div className="dashboard-card">
                <div className="card-header">
                  <i className="fas fa-user-plus"></i>
                  <h3>New Patient Requests</h3>
                </div>
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
                          <button className="btn btn-primary btn-sm" title="Accept"
                            onClick={() => respondToRequest(r._id || r.id, 'accepted')}>
                            <i className="fas fa-check"></i>
                          </button>
                          <button className="btn btn-outline btn-sm" title="Reject"
                            onClick={() => respondToRequest(r._id || r.id, 'rejected')}>
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Doctor Profile */}
              <div className="dashboard-card">
                <div className="card-header">
                  <i className="fas fa-user-md"></i>
                  <h3>Your Profile</h3>
                </div>
                <div className="card-body">
                  <div className="profile-summary">
                    <div className="profile-avatar-large"><i className="fas fa-user-md"></i></div>
                    <div className="profile-details">
                      <h4>Dr. {d?.name || '-'}</h4>
                      <p className="specialization">{d?.specialization || '-'}</p>
                      <p className="hospital"><i className="fas fa-hospital"></i> {d?.regState || d?.hospital || 'N/A'}</p>
                      <div className="profile-stats">
                        <div>
                          <span className="number">{(d?.experience ?? '-') + '+'}</span>
                          <span className="label">Years Exp.</span>
                        </div>
                        <div>
                          <span className="number">{stats.total + '+'}</span>
                          <span className="label">Patients</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-outline btn-full" onClick={() => showToast('Edit profile coming soon!', 'info')}>
                    <i className="fas fa-edit"></i> Edit Profile
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="dashboard-card full-width">
                <div className="card-header">
                  <i className="fas fa-bolt"></i>
                  <h3>Quick Actions</h3>
                </div>
                <div className="card-body">
                  <div className="quick-actions">
                    {[
                      { icon: 'fa-calendar-plus', label: 'Schedule Appointment' },
                      { icon: 'fa-prescription-bottle-alt', label: 'Write Prescription' },
                      { icon: 'fa-file-medical-alt', label: 'Create Medical Report' },
                      { icon: 'fa-envelope', label: 'Send Message' },
                      { icon: 'fa-video', label: 'Start Video Call' },
                      { icon: 'fa-chart-bar', label: 'View Analytics' },
                    ].map(a => (
                      <button key={a.label} className="action-btn"
                        onClick={() => showToast(`${a.label} coming soon!`, 'info')}>
                        <i className={`fas ${a.icon}`}></i>
                        <span>{a.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </main>

      {prescriptionModal && (
        <PrescriptionModal
          patientId={prescriptionModal.patientId}
          doctorId={doctor.id}
          token={token}
          onClose={() => setPrescriptionModal(null)}
          onSuccess={loadPrescriptions}
        />
      )}

      {meetingCard && (
        <MeetingLinkCard
          link={meetingCard.link}
          appointment={meetingCard.appointment}
          onClose={() => setMeetingCard(null)}
        />
      )}

      <Toast />
    </div>
  )
}