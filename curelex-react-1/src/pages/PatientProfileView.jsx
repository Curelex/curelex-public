import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Toast, useToast } from '../components/Toast'
import { API, authHeaders } from '../utils/helpers'

const BLOOD_GROUPS = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−']
const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say']

// ─── Hoisted outside component so they never remount on state change ──────────

function Field({ label, fieldKey, icon, type = 'text', options, form, setForm, editing }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280',
        marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
      }}>
        <i className={`fas ${icon}`} style={{ marginRight: 5, color: '#2563eb' }}></i>
        {label}
      </label>
      {editing ? (
        type === 'select' ? (
          <select
            value={form[fieldKey] || ''}
            onChange={e => setForm(f => ({ ...f, [fieldKey]: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, background: 'white', color: '#111827', outline: 'none' }}
          >
            <option value="">Select {label}</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            type={type}
            value={form[fieldKey] || ''}
            onChange={e => setForm(f => ({ ...f, [fieldKey]: e.target.value }))}
            placeholder={label}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = '#2563eb'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
        )
      ) : (
        <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: 10, fontSize: 14, color: form[fieldKey] ? '#111827' : '#9ca3af', border: '1px solid #f0f0f0' }}>
          {form[fieldKey] || <span style={{ fontStyle: 'italic' }}>Not set</span>}
        </div>
      )}
    </div>
  )
}

function TextAreaField({ label, fieldKey, icon, placeholder, form, setForm, editing }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        <i className={`fas ${icon}`} style={{ marginRight: 5, color: '#2563eb' }}></i>
        {label}
      </label>
      {editing ? (
        <textarea
          value={form[fieldKey] || ''}
          onChange={e => setForm(f => ({ ...f, [fieldKey]: e.target.value }))}
          placeholder={placeholder || label}
          rows={3}
          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, color: '#111827', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
          onFocus={e => e.target.style.borderColor = '#2563eb'}
          onBlur={e => e.target.style.borderColor = '#e5e7eb'}
        />
      ) : (
        <div style={{ padding: '12px', background: '#f9fafb', borderRadius: 10, fontSize: 14, color: form[fieldKey] ? '#374151' : '#9ca3af', border: '1px solid #f0f0f0', lineHeight: 1.6 }}>
          {form[fieldKey] || <span style={{ fontStyle: 'italic' }}>Not set</span>}
        </div>
      )}
    </div>
  )
}

export default function PatientProfileView() {
  const { currentUser: patient, token, logout } = useAuth()
  const navigate = useNavigate()
  const showToast = useToast()

  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({})
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)

  useEffect(() => {
    if (!patient) { navigate('/patient-login'); return }
    loadProfile()
  }, [])

  // Real API call (commented out – uncomment for production):
  async function loadProfile() {
    setLoading(true)
    try {
      const res = await fetch(`${API}/patients/${patient.id}`, { headers: authHeaders(token) })
      const data = await res.json()
      const p = data.patient || data
      setProfile(p)
      setForm({
        name: p.name || '',
        email: p.email || '',
        mobile: p.mobile || p.phone || '',
        dob: p.dob || '',
        gender: p.gender || '',
        bloodGroup: p.bloodGroup || '',
        height: p.height || '',
        weight: p.weight || '',
        address: p.address || '',
        emergencyContact: p.emergencyContact || '',
        emergencyName: p.emergencyName || '',
        allergies: p.allergies || '',
        chronicConditions: p.chronicConditions || '',
        currentMedications: p.currentMedications || '',
        notes: p.notes || '',
      })
      setPhotoPreview(p.photo || null)
    } catch {
      const stored = localStorage.getItem('patient-data')
      if (stored) {
        const p = JSON.parse(stored)
        setProfile(p)
        setForm({ name: p.name || '', email: p.email || '', mobile: p.mobile || '', dob: p.dob || '', gender: p.gender || '', bloodGroup: p.bloodGroup || '', height: p.height || '', weight: p.weight || '', address: p.address || '', emergencyContact: p.emergencyContact || '', emergencyName: p.emergencyName || '', allergies: p.allergies || '', chronicConditions: p.chronicConditions || '', currentMedications: p.currentMedications || '', notes: p.notes || '' })
        setPhotoPreview(p.photo || null)
      }
    }
    setLoading(false)
  }

 

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB', 'error'); return }
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!form.name?.trim()) { showToast('Name is required', 'error'); return }
    setSaving(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => v && formData.append(k, v))
      if (photoFile) formData.append('photo', photoFile)

      const res = await fetch(`${API}/patients/${patient.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        showToast('Profile updated successfully!', 'success')
        setProfile({ ...profile, ...form, photo: photoPreview })
        setEditing(false)
        const stored = localStorage.getItem('patient-data')
        if (stored) {
          const p = JSON.parse(stored)
          localStorage.setItem('patient-data', JSON.stringify({ ...p, ...form, photo: photoPreview }))
        }
      } else {
        showToast(data.message || 'Update failed', 'error')
      }
    } catch {
      showToast('Saved locally (server unreachable)', 'info')
      setProfile({ ...profile, ...form, photo: photoPreview })
      setEditing(false)
    }
    setSaving(false)
  }

  const calcAge = (dob) => {
    if (!dob) return null
    const diff = Date.now() - new Date(dob).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
  }

  const bmi = () => {
    const h = parseFloat(form.height) / 100
    const w = parseFloat(form.weight)
    if (!h || !w) return null
    const val = (w / (h * h)).toFixed(1)
    let label = 'Normal'
    let color = '#10b981'
    if (val < 18.5) { label = 'Underweight'; color = '#f59e0b' }
    else if (val >= 25 && val < 30) { label = 'Overweight'; color = '#f59e0b' }
    else if (val >= 30) { label = 'Obese'; color = '#ef4444' }
    return { val, label, color }
  }

  const initials = (profile?.name || patient?.name || 'PT')
    .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: 48, color: '#2563eb' }}></i>
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading profile...</p>
        </div>
      </div>
    )
  }

  const d = profile
  const age = calcAge(d?.dob)
  const bmiInfo = bmi()

  const btnBase = { border: 'none', borderRadius: 10, padding: '9px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }

  // Shared props passed down to every Field / TextAreaField
  const fp = { form, setForm, editing }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'Inter, sans-serif' }}>

      {/* Top bar */}
      <header style={{
        background: 'white', borderBottom: '1px solid #e5e7eb',
        padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/doctor-dashboard')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 18, padding: 6, borderRadius: 8 }}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <span style={{ fontWeight: 700, fontSize: 17, color: '#111827' }}>My Profile</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {!editing ? (
            <button onClick={() => setEditing(true)}
              style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: 'white', border: 'none', borderRadius: 10, padding: '9px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="fas fa-edit"></i> Edit Profile
            </button>
          ) : (
            <>
              <button onClick={() => { setEditing(false); setPhotoPreview(d?.photo || null); setPhotoFile(null) }}
                style={{ background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 10, padding: '9px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', borderRadius: 10, padding: '9px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}>
                {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-check"></i> Save Changes</>}
              </button>
            </>
          )}
          <button onClick={() => { logout(); navigate('/') }}
            style={{ background: 'white', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: 10, padding: '9px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 16px' }}>

        {/* Profile Hero Card */}
        <div style={{
          background: 'white', borderRadius: 20, padding: '32px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.08)', marginBottom: 24,
          display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap',
        }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: photoPreview ? 'transparent' : 'linear-gradient(135deg,#2563eb,#7c3aed)',
              backgroundImage: photoPreview ? `url(${photoPreview})` : undefined,
              backgroundSize: 'cover', backgroundPosition: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, fontWeight: 700, color: 'white',
              boxShadow: '0 4px 16px rgba(37,99,235,0.25)',
              border: '3px solid white',
            }}>
              {!photoPreview && initials}
            </div>
            {editing && (
              <label htmlFor="photo-upload" style={{
                position: 'absolute', bottom: -4, right: -4,
                width: 32, height: 32, borderRadius: '50%',
                background: '#2563eb', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 13, boxShadow: '0 2px 8px rgba(37,99,235,0.4)',
                border: '2px solid white',
              }}>
                <i className="fas fa-camera"></i>
                <input id="photo-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
              </label>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' }}>
                {d?.name || patient?.name}
              </h1>
              {age && (
                <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                  {age} yrs old
                </span>
              )}
              {d?.bloodGroup && (
                <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                  <i className="fas fa-tint" style={{ marginRight: 4 }}></i>{d.bloodGroup}
                </span>
              )}
            </div>
            {d?.gender && (
              <p style={{ margin: '0 0 4px', color: '#2563eb', fontWeight: 600, fontSize: 15 }}>
                <i className="fas fa-venus-mars" style={{ marginRight: 6 }}></i>{d.gender}
              </p>
            )}
            {d?.mobile && (
              <p style={{ margin: '0 0 4px', color: '#6b7280', fontSize: 14 }}>
                <i className="fas fa-phone" style={{ marginRight: 6 }}></i>{d.mobile}
              </p>
            )}
            {d?.email && (
              <p style={{ margin: '0 0 4px', color: '#6b7280', fontSize: 14 }}>
                <i className="fas fa-envelope" style={{ marginRight: 6 }}></i>{d.email}
              </p>
            )}
            {d?.address && (
              <p style={{ margin: '0 0 4px', color: '#6b7280', fontSize: 14 }}>
                <i className="fas fa-map-marker-alt" style={{ marginRight: 6, color: '#10b981' }}></i>{d.address}
              </p>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Visits',   value: d?.totalAppointments || '—',    icon: 'fa-calendar-check', color: '#2563eb' },
              { label: 'Upcoming', value: d?.upcomingAppointments || '—', icon: 'fa-clock',           color: '#10b981' },
              bmiInfo
                ? { label: 'BMI', value: bmiInfo.val, icon: 'fa-weight', color: bmiInfo.color }
                : { label: 'BMI', value: '—',         icon: 'fa-weight', color: '#9ca3af' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', minWidth: 64 }}>
                <div style={{ fontSize: 22, color: s.color, marginBottom: 4 }}>
                  <i className={`fas ${s.icon}`}></i>
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{s.label}</div>
                {s.label === 'BMI' && bmiInfo && (
                  <div style={{ fontSize: 10, color: bmiInfo.color, fontWeight: 600 }}>{bmiInfo.label}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Personal Information */}
        <div style={{ background: 'white', borderRadius: 20, padding: '28px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)', marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="fas fa-id-card" style={{ color: '#2563eb' }}></i>
            {editing ? 'Edit Personal Information' : 'Personal Information'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <Field label="Full Name"       fieldKey="name"       icon="fa-user"           type="text"   {...fp} />
            <Field label="Email"           fieldKey="email"      icon="fa-envelope"       type="email"  {...fp} />
            <Field label="Mobile Number"   fieldKey="mobile"     icon="fa-phone"          type="tel"    {...fp} />
            <Field label="Date of Birth"   fieldKey="dob"        icon="fa-birthday-cake"  type="date"   {...fp} />
            <Field label="Gender"          fieldKey="gender"     icon="fa-venus-mars"     type="select" options={GENDER_OPTIONS} {...fp} />
            <Field label="Blood Group"     fieldKey="bloodGroup" icon="fa-tint"           type="select" options={BLOOD_GROUPS}   {...fp} />
            <Field label="Height (cm)"     fieldKey="height"     icon="fa-ruler-vertical" type="number" {...fp} />
            <Field label="Weight (kg)"     fieldKey="weight"     icon="fa-weight"         type="number" {...fp} />
            <Field label="Home Address"    fieldKey="address"    icon="fa-map-marker-alt" type="text"   {...fp} />
          </div>

          {editing && (
            <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 20, borderTop: '1px solid #f0f0f0' }}>
              <button onClick={() => { setEditing(false); setPhotoPreview(d?.photo || null); setPhotoFile(null) }}
                style={{ ...btnBase, background: 'white', color: '#6b7280', border: '1.5px solid #e5e7eb' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ ...btnBase, background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', opacity: saving ? 0.7 : 1 }}>
                {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-check"></i> Save Changes</>}
              </button>
            </div>
          )}
        </div>

        {/* Emergency Contact */}
        <div style={{ background: 'white', borderRadius: 20, padding: '28px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)', marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="fas fa-phone-alt" style={{ color: '#ef4444' }}></i>
            Emergency Contact
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <Field label="Contact Name"   fieldKey="emergencyName"    icon="fa-user-friends" type="text" {...fp} />
            <Field label="Contact Number" fieldKey="emergencyContact" icon="fa-phone"         type="tel"  {...fp} />
          </div>
        </div>

        {/* Medical Information */}
        <div style={{ background: 'white', borderRadius: 20, padding: '28px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)', marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="fas fa-heartbeat" style={{ color: '#ef4444' }}></i>
            Medical Information
          </h2>

          <div style={{ display: 'grid', gap: 20 }}>
            <TextAreaField label="Known Allergies"     fieldKey="allergies"          icon="fa-allergies"     placeholder="e.g. Penicillin, Pollen, Peanuts..."             {...fp} />
            <TextAreaField label="Chronic Conditions"  fieldKey="chronicConditions"  icon="fa-notes-medical" placeholder="e.g. Hypertension, Diabetes Type 2..."            {...fp} />
            <TextAreaField label="Current Medications" fieldKey="currentMedications" icon="fa-pills"         placeholder="e.g. Metformin 500mg twice daily..."              {...fp} />
            <TextAreaField label="Additional Notes"    fieldKey="notes"              icon="fa-sticky-note"   placeholder="Any other relevant information for your doctor..." {...fp} />
          </div>

          {editing && (
            <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 20, borderTop: '1px solid #f0f0f0' }}>
              <button onClick={() => { setEditing(false); setPhotoPreview(d?.photo || null); setPhotoFile(null) }}
                style={{ ...btnBase, background: 'white', color: '#6b7280', border: '1.5px solid #e5e7eb' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ ...btnBase, background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', opacity: saving ? 0.7 : 1 }}>
                {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-check"></i> Save Changes</>}
              </button>
            </div>
          )}
        </div>

        {/* Account Security */}
        <div style={{ background: 'white', borderRadius: 20, padding: '28px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="fas fa-shield-alt" style={{ color: '#10b981' }}></i>
            Account Security
          </h2>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ margin: 0, fontSize: 14, color: '#374151' }}>
                <strong>Registered Email:</strong> {d?.email || patient?.email}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#6b7280' }}>
                Contact support to change your registered email.
              </p>
            </div>
            <button onClick={() => showToast('Password change coming soon!', 'info')}
              style={{ ...btnBase, background: 'white', color: '#2563eb', border: '1.5px solid #2563eb' }}>
              <i className="fas fa-key"></i> Change Password
            </button>
          </div>
        </div>

      </div>

      <Toast />
    </div>
  )
}