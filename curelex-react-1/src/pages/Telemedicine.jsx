import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API, authHeaders } from '../utils/helpers'

/* ── Speciality list ─────────────────────────────────────── */
const SPECIALITIES = [
  { label: 'General Physician',  icon: '🩺', color: '#3b82f6' },
  { label: 'Dermatologist',      icon: '🧴', color: '#f59e0b' },
  { label: 'Gynaecologist',      icon: '🌸', color: '#ec4899' },
  { label: 'Psychiatrist',       icon: '🧠', color: '#8b5cf6' },
  { label: 'Paediatrician',      icon: '👶', color: '#10b981' },
  { label: 'Cardiologist',       icon: '❤️', color: '#ef4444' },
  { label: 'Neurologist',        icon: '⚡', color: '#6366f1' },
  { label: 'Orthopaedic',        icon: '🦴', color: '#f97316' },
]

const CONCERNS = [
  { label: 'Cold, Cough or Fever',         icon: '🤧' },
  { label: 'Skin Rash or Acne',            icon: '😣' },
  { label: 'Period or Pregnancy',          icon: '🌸' },
  { label: 'Anxiety or Depression',        icon: '💆' },
  { label: 'Child not feeling well',       icon: '🧒' },
  { label: 'Performance issues in bed',    icon: '💊' },
]

/* ══════════════════════════════════════════════════════════
   DOCTOR CARD
   ══════════════════════════════════════════════════════════ */
function DoctorCard({ doc, onConsult }) {
  const [hovered, setHovered] = useState(false)

  const isAvailable = doc.verificationStatus === 'approved' && doc.isActive === true

  // ✅ FIX 1: Show actual specialization from doctor's profile,
  //           no fallback to 'General Physician'
  const specialization = doc.specialization || ''

  // ✅ FIX 2: Show experience with "+" suffix (e.g. "5+ yrs")
  const experienceLabel = doc.experience != null
    ? `${doc.experience}+ yr${doc.experience !== 1 ? 's' : ''} experience`
    : null

  return (
    <div
      onMouseEnter={() => isAvailable && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isAvailable ? '#fff' : '#f9fafb',
        border: `1.5px solid ${hovered ? '#2563eb' : isAvailable ? '#e5e7eb' : '#e5e7eb'}`,
        borderRadius: 20,
        padding: '20px 20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'all 0.22s ease',
        boxShadow: hovered ? '0 8px 28px rgba(37,99,235,0.13)' : '0 2px 8px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-3px)' : 'none',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
        opacity: isAvailable ? 1 : 0.52,
        filter: isAvailable ? 'none' : 'grayscale(70%)',
      }}
    >
      {/* Status dot */}
      <span style={{
        position: 'absolute', top: 14, right: 14,
        background: isAvailable ? '#22c55e' : '#9ca3af',
        width: 10, height: 10,
        borderRadius: '50%', border: '2px solid #fff',
        boxShadow: isAvailable ? '0 0 0 3px rgba(34,197,94,0.2)' : 'none',
      }} />

      {/* Avatar + name */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        {doc.photoUrl ? (
          <img src={doc.photoUrl} alt={doc.name} style={{
            width: 60, height: 60, borderRadius: '50%', objectFit: 'cover',
            border: `2px solid ${isAvailable ? '#dbeafe' : '#e5e7eb'}`,
          }} />
        ) : (
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: isAvailable
              ? 'linear-gradient(135deg,#dbeafe,#bfdbfe)'
              : 'linear-gradient(135deg,#f3f4f6,#e5e7eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700,
            color: isAvailable ? '#2563eb' : '#9ca3af',
            flexShrink: 0,
          }}>
            {doc.name?.charAt(0)?.toUpperCase() || 'D'}
          </div>
        )}
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: isAvailable ? '#111827' : '#6b7280' }}>
            Dr. {doc.name}
          </div>
          {/* ✅ FIX 1 APPLIED: Only show specialization if it exists, no hardcoded fallback */}
          {specialization ? (
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              {specialization}
            </div>
          ) : null}
          {/* ✅ FIX 2 APPLIED: Experience shown as "5+ yrs experience" */}
          {experienceLabel && (
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
              {experienceLabel}
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {isAvailable ? (
          <>
            <span style={{ background: '#eff6ff', color: '#2563eb', fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 20 }}>
              ✓ Verified
            </span>
            <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 20 }}>
              🟢 Online Now
            </span>
          </>
        ) : (
          <span style={{ background: '#f3f4f6', color: '#9ca3af', fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 20 }}>
            {doc.verificationStatus === 'rejected'
              ? '✕ Not Available'
              : doc.verificationStatus === 'approved'
                ? '🔴 Offline'
                : '⏳ Pending Approval'}
          </span>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b7280', flexWrap: 'wrap' }}>
        {doc.patientsHandeled != null && (
          <span>👥 {doc.patientsHandeled.toLocaleString()} patients</span>
        )}
        {doc.gender && (
          <span style={{ textTransform: 'capitalize' }}>
            {doc.gender === 'female' ? '♀' : '♂'} {doc.gender}
          </span>
        )}
        {doc.regState && (
          <span>📍 {doc.regState}</span>
        )}
        {isAvailable && <span>⏱ ~5 min wait</span>}
      </div>

      {/* Fee + CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        {isAvailable ? (
          <>
            <div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>Consultation fee</div>
              <div style={{ fontWeight: 700, fontSize: 17, color: '#111827' }}>₹299</div>
            </div>
            <button
              onClick={() => onConsult(doc)}
              style={{
                background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                color: '#fff', border: 'none', borderRadius: 12,
                padding: '10px 20px', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'opacity 0.18s',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7,
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <span style={{ fontSize: 15 }}>📹</span> Consult Now
            </button>
          </>
        ) : (
          <span style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>
            Currently unavailable for consultations
          </span>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════ */
export default function TelemedicinePage() {
  const { currentUser, token } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [allDoctors,   setAllDoctors]   = useState([])
  const [loading,      setLoading]      = useState(true)
  const [activeSpec,   setActiveSpec]   = useState('All')
  const [searchQuery,  setSearchQuery]  = useState('')
  const [consultModal, setConsultModal] = useState(null)

  useEffect(() => {
    if (!currentUser) { navigate('/'); return }

    if (location.state?.selectedDoctor) {
      setConsultModal(location.state.selectedDoctor)
    }

    ;(async () => {
      try {
        const res  = await fetch(`${API}/doctors`, { headers: authHeaders(token) })
        const data = await res.json()
        const list = data.doctors || (Array.isArray(data) ? data : [])
        list.sort((a, b) => {
          const score = (d) => {
            if (d.verificationStatus === 'approved' && d.isActive) return 0
            if (d.verificationStatus === 'approved' && !d.isActive) return 1
            if (d.verificationStatus === 'pending') return 2
            return 3
          }
          return score(a) - score(b)
        })
        setAllDoctors(list)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    })()
  }, [])

  const onlineDoctors = allDoctors.filter(d => d.verificationStatus === 'approved' && d.isActive === true)

  const specs = ['All', ...new Set(onlineDoctors.filter(d => d.specialization).map(d => d.specialization))]

  const filtered = allDoctors.filter(d => {
    const available = d.verificationStatus === 'approved' && d.isActive === true
    if (!available) return true
    const matchSpec   = activeSpec === 'All' || d.specialization === activeSpec
    const matchSearch = !searchQuery ||
      d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchSpec && matchSearch
  }).filter(d => {
    if (!searchQuery) return true
    return (
      d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .tele-hero-right { display: none !important; }
          .tele-topbar { flex-direction: column !important; align-items: flex-start !important; }
        }
      `}</style>

      {/* ══ TOPBAR ══ */}
      <header className="tele-topbar" style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <img src="/assets/logo.png" alt="CURELEX" style={{ height: 36, cursor: 'pointer' }}
          onClick={() => navigate('/patient-dashboard')} />
        <div style={{ width: 1, height: 28, background: '#e5e7eb' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>📹</span>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#111827' }}>Video Consultation</span>
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{ marginLeft: 'auto', background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 14px', fontSize: 13, color: '#6b7280', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          ← Back
        </button>
      </header>

      {/* ══ HERO BANNER ══ */}
      <div style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 40%, #bfdbfe 100%)',
        padding: '56px 40px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(37,99,235,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: '35%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(99,102,241,0.06)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#dbeafe', color: '#1d4ed8', fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 20, marginBottom: 18, letterSpacing: '0.05em' }}>
              🟢 DOCTORS ONLINE NOW
            </div>
            <h1 style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 800, color: '#111827', margin: '0 0 14px', lineHeight: 1.2 }}>
              Skip the travel!<br />
              <span style={{ color: '#2563eb' }}>Take Online Doctor</span><br />
              Consultation
            </h1>
            <p style={{ fontSize: 15, color: '#4b5563', margin: '0 0 6px' }}>
              Private consultation + Video call · Starts at just <strong style={{ color: '#111827' }}>₹199</strong>
            </p>
            <div style={{ display: 'flex', gap: 20, margin: '18px 0 28px', flexWrap: 'wrap' }}>
              {['✓ Verified Doctors', '📋 Digital Prescription', '💬 Free Follow-up'].map(f => (
                <span key={f} style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{f}</span>
              ))}
            </div>
            <button
              onClick={() => document.getElementById('tele-doctors')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff',
                border: 'none', borderRadius: 14, padding: '14px 36px', fontSize: 16,
                fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 18px rgba(37,99,235,0.35)', transition: 'transform 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              Consult Now →
            </button>
          </div>

          <div className="tele-hero-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, minWidth: 200 }}>
            <div style={{ position: 'relative', width: 120, height: 120 }}>
              <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>
                👨‍⚕️
              </div>
              <span style={{ position: 'absolute', bottom: 4, right: 4, background: '#22c55e', borderRadius: '50%', width: 22, height: 22, border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span>
            </div>
            <div style={{ background: '#fff', borderRadius: 16, padding: '12px 24px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#2563eb' }}>
                {loading ? '…' : `+${onlineDoctors.length}`}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Doctors Online</div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ CONCERNS STRIP ══ */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f3f4f6', padding: '28px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
            Common health concerns
          </h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {CONCERNS.map(c => (
              <button
                key={c.label}
                onClick={() => setSearchQuery(c.label.split(' ')[0])}
                style={{
                  background: '#f8fafc', border: '1.5px solid #e5e7eb', borderRadius: 28,
                  padding: '9px 18px', fontSize: 13, fontWeight: 500, color: '#374151',
                  cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'all 0.18s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.background = '#eff6ff' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.background = '#f8fafc' }}
              >
                <span>{c.icon}</span> {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ DOCTORS SECTION ══ */}
      <div id="tele-doctors" style={{ maxWidth: 1100, margin: '40px auto', padding: '0 24px' }}>

        {/* Search */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ position: 'relative', maxWidth: 460, marginBottom: 18 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#9ca3af' }}>🔍</span>
            <input
              type="text"
              placeholder="Search doctors or specializations…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '11px 14px 11px 42px',
                border: '1.5px solid #e5e7eb', borderRadius: 12,
                fontSize: 14, outline: 'none', fontFamily: 'inherit',
                color: '#111827', background: '#fff', boxSizing: 'border-box',
                transition: 'border-color 0.18s',
              }}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e  => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {specs.map(s => (
              <button
                key={s}
                onClick={() => setActiveSpec(s)}
                style={{
                  padding: '7px 16px', borderRadius: 22, fontSize: 12, fontWeight: 600,
                  border: '1.5px solid', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.17s',
                  borderColor: activeSpec === s ? '#2563eb' : '#e5e7eb',
                  background:  activeSpec === s ? '#2563eb' : '#fff',
                  color:       activeSpec === s ? '#fff'    : '#6b7280',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ fontWeight: 800, fontSize: 20, color: '#111827', margin: 0 }}>
            Available Doctors
          </h2>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#6b7280' }}>
            <span>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#22c55e', marginRight: 5 }}></span>
              {onlineDoctors.length} online
            </span>
            <span>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#9ca3af', marginRight: 5 }}></span>
              {allDoctors.length - onlineDoctors.length} offline / pending
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af', fontSize: 15 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
            Loading doctors…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af', fontSize: 15 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            No doctors found matching your search.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {filtered.map(doc => (
              <DoctorCard key={doc.id} doc={doc} onConsult={setConsultModal} />
            ))}
          </div>
        )}
      </div>

      {/* ══ CONSULT MODAL ══ */}
      {consultModal && (
        <div
          onClick={() => setConsultModal(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(2px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 24, padding: 36,
              maxWidth: 420, width: '92%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
              animation: 'slideUp 0.22s ease',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>📹</div>
              <h2 style={{ fontWeight: 800, fontSize: 20, margin: '0 0 6px', color: '#111827' }}>
                Book Video Consultation
              </h2>
              <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
                You're about to consult with
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#f8fafc', borderRadius: 16, padding: 16, marginBottom: 24 }}>
              {consultModal.photoUrl ? (
                <img src={consultModal.photoUrl} alt={consultModal.name}
                  style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid #dbeafe' }} />
              ) : (
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#dbeafe,#bfdbfe)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 700, color: '#2563eb', flexShrink: 0,
                }}>
                  {consultModal.name?.charAt(0)?.toUpperCase() || 'D'}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Dr. {consultModal.name}</div>
                {/* ✅ FIX 1 APPLIED IN MODAL TOO: no hardcoded 'General Physician' fallback */}
                {consultModal.specialization && (
                  <div style={{ fontSize: 13, color: '#6b7280' }}>{consultModal.specialization}</div>
                )}
                {/* ✅ FIX 2 APPLIED IN MODAL TOO: experience with "+" */}
                {consultModal.experience != null && (
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                    {consultModal.experience}+ yrs experience
                  </div>
                )}
                <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, marginTop: 2 }}>🟢 Available Now</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#111827' }}>₹299</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>per session</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setConsultModal(null)}
                style={{
                  flex: 1, background: '#f3f4f6', color: '#374151',
                  border: 'none', borderRadius: 12, padding: '13px 0',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(`Booking consultation with Dr. ${consultModal.name}…`)
                  setConsultModal(null)
                }}
                style={{
                  flex: 2, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                  color: '#fff', border: 'none', borderRadius: 12,
                  padding: '13px 0', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                }}
              >
                Confirm & Pay ₹299 →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}