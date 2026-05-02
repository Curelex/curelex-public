/**
 * MyAppointmentsView.jsx
 *
 * Drop this file into your components (or pages) folder.
 *
 * Usage inside PatientDashboard.jsx:
 *   1. Import at the top:
 *        import MyAppointmentsView from '../components/MyAppointmentsView'
 *
 *   2. Add this block where you render activeNav === 'appointments':
 *        {activeNav === 'appointments' && (
 *          <MyAppointmentsView
 *            currentUser={currentUser}
 *            token={token}
 *          />
 *        )}
 *
 * Dependencies (add to your project if not already present):
 *   npm install jspdf jspdf-autotable
 */

import { useState, useEffect, useCallback } from 'react'
import { API, authHeaders, formatDate, formatTime } from '../utils/helpers'

/* ─── tiny inline helpers ──────────────────────────────────────── */
const badge = (label, bg, color, border) => ({
  display: 'inline-flex', alignItems: 'center', gap: 5,
  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
  background: bg, color, border: `1px solid ${border}`,
})

/* ─── PDF generator (uses jsPDF loaded from CDN if not bundled) ── */
async function generatePDF(appt, prescriptions) {
  // Dynamically import jsPDF so it doesn't break if not bundled
  let jsPDF, autoTable
  try {
    const mod  = await import('jspdf')
    jsPDF      = mod.jsPDF || mod.default
    const mod2 = await import('jspdf-autotable')
    autoTable  = mod2.default
  } catch {
    // fallback: load from CDN via script tag
    await new Promise((res, rej) => {
      if (window.jspdf) return res()
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      s.onload = res; s.onerror = rej
      document.head.appendChild(s)
    })
    await new Promise((res, rej) => {
      if (window.jspdf?.jsPDF) return res()
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'
      s.onload = res; s.onerror = rej
      document.head.appendChild(s)
    })
    jsPDF     = window.jspdf?.jsPDF
    autoTable = null // plugin attaches itself to jsPDF prototype
  }

  if (!jsPDF) { alert('PDF library could not load. Please try again.'); return }

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W   = doc.internal.pageSize.getWidth()
  const margin = 16

  // ── Header bar ──────────────────────────────────────────────────
  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, W, 36, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('CURELEX', margin, 15)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('CONNECT · CONSULT · CARE', margin, 21)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Medical Consultation Report', W - margin, 13, { align: 'right' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, W - margin, 19, { align: 'right' })

  let y = 44

  // ── Appointment info box ─────────────────────────────────────────
  doc.setFillColor(239, 246, 255)
  doc.roundedRect(margin, y, W - margin * 2, 30, 3, 3, 'F')
  doc.setDrawColor(147, 197, 253)
  doc.roundedRect(margin, y, W - margin * 2, 30, 3, 3, 'S')

  doc.setTextColor(30, 64, 175)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Appointment Details', margin + 6, y + 8)

  doc.setTextColor(55, 65, 81)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  const apptDate = new Date(appt.appointmentTime)
  const col1x = margin + 6
  const col2x = W / 2 + 4

  doc.text(`Date:    ${apptDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, col1x, y + 16)
  doc.text(`Time:    ${apptDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, col1x, y + 22)
  doc.text(`Doctor:  Dr. ${appt.doctor?.name || `#${appt.doctorId}`}`, col2x, y + 16)
  doc.text(`Specialty: ${appt.doctor?.specialization || 'General'}`, col2x, y + 22)

  y += 36

  // ── Patient info ─────────────────────────────────────────────────
  doc.setFillColor(249, 250, 251)
  doc.roundedRect(margin, y, W - margin * 2, 20, 3, 3, 'F')
  doc.setDrawColor(229, 231, 235)
  doc.roundedRect(margin, y, W - margin * 2, 20, 3, 3, 'S')

  doc.setTextColor(17, 24, 39)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Patient:', col1x, y + 8)
  doc.setFont('helvetica', 'normal')
  doc.text(appt.patientName || 'Patient', col1x + 18, y + 8)

  if (appt.symptoms) {
    doc.setFont('helvetica', 'bold')
    doc.text('Chief Complaint:', col2x, y + 8)
    doc.setFont('helvetica', 'normal')
    const wrapped = doc.splitTextToSize(appt.symptoms, 70)
    doc.text(wrapped[0], col2x + 34, y + 8)
  }

  y += 26

  // ── Diagnosis ────────────────────────────────────────────────────
  if (appt.diagnosis) {
    doc.setFillColor(219, 234, 254)
    doc.setDrawColor(147, 197, 253)
    doc.roundedRect(margin, y, W - margin * 2, 4, 1, 1, 'F')

    y += 8
    doc.setTextColor(30, 64, 175)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text("Doctor's Diagnosis", margin, y)
    y += 6

    doc.setTextColor(55, 65, 81)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setFillColor(239, 246, 255)
    doc.roundedRect(margin, y, W - margin * 2, 14, 2, 2, 'F')
    const diagLines = doc.splitTextToSize(appt.diagnosis, W - margin * 2 - 12)
    doc.text(diagLines, margin + 6, y + 6)
    y += 20
  }

  // ── Medicines table ──────────────────────────────────────────────
  const allMeds = []
  prescriptions.forEach(rx => {
    (rx.medicines || []).forEach(m => allMeds.push(m))
  })

  if (allMeds.length > 0) {
    doc.setTextColor(109, 40, 217)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Prescribed Medicines', margin, y)
    y += 4

    const tableBody = allMeds.map((m, i) => [
      i + 1,
      m.name || '-',
      m.dosage || '-',
      m.frequency || '-',
      m.duration || '-',
    ])

    const tableConfig = {
      startY: y,
      head: [['#', 'Medicine Name', 'Dosage', 'Frequency', 'Duration']],
      body: tableBody,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: {
        fillColor: [124, 58, 237],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [250, 245, 255] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 55 },
        2: { cellWidth: 30 },
        3: { cellWidth: 35 },
        4: { cellWidth: 35 },
      },
    }

    if (doc.autoTable) {
      doc.autoTable(tableConfig)
    } else if (autoTable) {
      autoTable(doc, tableConfig)
    }

    y = (doc.lastAutoTable?.finalY || y + tableBody.length * 8 + 14) + 8
  }

  // ── Tests table ──────────────────────────────────────────────────
  let tests = appt.tests
  if (typeof tests === 'string') { try { tests = JSON.parse(tests) } catch { tests = [] } }
  if (Array.isArray(tests) && tests.length > 0) {
    doc.setTextColor(8, 145, 178)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Tests Ordered', margin, y)
    y += 4

    const testsBody = tests.map((t, i) => [i + 1, t.name || '-', t.type || '-'])

    const testsConfig = {
      startY: y,
      head: [['#', 'Test Name', 'Category']],
      body: testsBody,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [8, 145, 178], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [236, 254, 255] },
    }

    if (doc.autoTable) {
      doc.autoTable(testsConfig)
    } else if (autoTable) {
      autoTable(doc, testsConfig)
    }

    y = (doc.lastAutoTable?.finalY || y + testsBody.length * 8 + 14) + 8
  }

  // ── Doctor Notes ─────────────────────────────────────────────────
  if (appt.doctorNotes) {
    doc.setTextColor(180, 83, 9)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Clinical Notes', margin, y)
    y += 5

    doc.setFillColor(255, 251, 235)
    doc.setDrawColor(253, 230, 138)
    const noteLines = doc.splitTextToSize(appt.doctorNotes, W - margin * 2 - 12)
    const noteH = Math.max(14, noteLines.length * 5 + 8)
    doc.roundedRect(margin, y, W - margin * 2, noteH, 2, 2, 'FD')
    doc.setTextColor(120, 53, 15)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(noteLines, margin + 6, y + 6)
    y += noteH + 8
  }

  // ── Follow-up ────────────────────────────────────────────────────
  if (appt.followUpDate) {
    doc.setFillColor(220, 252, 231)
    doc.setDrawColor(134, 239, 172)
    doc.roundedRect(margin, y, W - margin * 2, 16, 2, 2, 'FD')
    doc.setTextColor(21, 128, 61)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Follow-up Appointment', margin + 6, y + 7)
    doc.setFont('helvetica', 'normal')
    const fuDate = new Date(appt.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    doc.text(`${fuDate}${appt.followUpInstructions ? '  —  ' + appt.followUpInstructions : ''}`, margin + 6, y + 13)
    y += 22
  }

  // ── Footer ───────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight()
  doc.setFillColor(243, 244, 246)
  doc.rect(0, pageH - 18, W, 18, 'F')
  doc.setTextColor(107, 114, 128)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('This is a computer-generated document from Curelex Healthcare. Verify with your doctor before taking any medication.', W / 2, pageH - 10, { align: 'center' })
  doc.text('www.curelex.in  |  support@curelex.in', W / 2, pageH - 5, { align: 'center' })

  // ── Save ─────────────────────────────────────────────────────────
  const fileName = `Curelex_Report_${new Date(appt.appointmentTime).toISOString().split('T')[0]}_Dr${appt.doctor?.name || appt.doctorId}.pdf`
  doc.save(fileName)
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function MyAppointmentsView({ currentUser, token }) {
  const [appointments,  setAppointments]  = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [generatingPdf, setGeneratingPdf] = useState(null) // appt id
  const [filter,        setFilter]        = useState('all') // 'all' | 'completed' | 'upcoming' | 'pending'

  const loadData = useCallback(async () => {
    if (!currentUser?.id) return
    setLoading(true)
    try {
      const [apptRes, rxRes] = await Promise.all([
        fetch(`${API}/appointments/patient/${currentUser.id}`, { headers: authHeaders(token) }),
        fetch(`${API}/prescriptions/patient/${currentUser.id}`, { headers: authHeaders(token) }),
      ])
      const apptData = await apptRes.json()
      const rxData   = await rxRes.json()

      setAppointments(apptData.appointments || [])
      setPrescriptions(rxData.prescriptions || [])
    } catch (err) {
      console.error('MyAppointmentsView load error:', err)
    }
    setLoading(false)
  }, [currentUser?.id, token])

  useEffect(() => { loadData() }, [loadData])

  const now = new Date()

  const enriched = appointments.map(a => {
    const apptTime    = new Date(a.appointmentTime)
    const isPast      = apptTime < now
    const isApproved  = a.doctorApproved === true
    const isCompleted = isPast && isApproved
    const isUpcoming  = !isPast && isApproved
    const isPending   = !isApproved && a.status !== 'cancelled'
    const isCancelled = a.status === 'cancelled'

    // find prescriptions linked to this appointment
   // find prescriptions — match by appointmentId first, fall back to same doctor+patient
const linked = prescriptions.filter(rx =>
  rx.appointmentId === a.id ||
  (rx.appointmentId == null && rx.doctorId === a.doctorId && rx.patientId === a.patientId)
)

    return { ...a, apptTime, isCompleted, isUpcoming, isPending, isCancelled, linkedPrescriptions: linked }
  }).sort((a, b) => b.apptTime - a.apptTime) // newest first

  const filtered = enriched.filter(a => {
    if (filter === 'completed') return a.isCompleted
    if (filter === 'upcoming')  return a.isUpcoming
    if (filter === 'pending')   return a.isPending
    return true
  })

  const counts = {
    all:       enriched.length,
    completed: enriched.filter(a => a.isCompleted).length,
    upcoming:  enriched.filter(a => a.isUpcoming).length,
    pending:   enriched.filter(a => a.isPending).length,
  }

  const handleDownloadPDF = async (appt) => {
    setGeneratingPdf(appt.id)
    try {
      await generatePDF(appt, appt.linkedPrescriptions)
    } catch (err) {
      console.error('PDF error:', err)
      alert('Failed to generate PDF. Please try again.')
    }
    setGeneratingPdf(null)
  }

  // ── Status badge config ──────────────────────────────────────────
  const getStatusBadge = (a) => {
    if (a.isCancelled) return { label: 'Cancelled',  bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' }
    if (a.isCompleted) return { label: 'Completed',  bg: '#dcfce7', color: '#16a34a', border: '#86efac' }
    if (a.isUpcoming)  return { label: 'Upcoming',   bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' }
    if (a.isPending)   return { label: 'Pending',    bg: '#fef9c3', color: '#a16207', border: '#fde68a' }
    return                     { label: 'Scheduled', bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <div style={{
          width: 52, height: 52, border: '4px solid #dbeafe', borderTopColor: '#2563eb',
          borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 16px',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <p style={{ color: '#6b7280', margin: 0 }}>Loading your appointments…</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>

      {/* ── Page header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)',
        border: '1.5px solid #dbeafe', borderRadius: 16,
        padding: '22px 28px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1e40af' }}>
            <i className="fas fa-calendar-check" style={{ marginRight: 10 }}></i>
            My Appointments
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
            Full history of all consultations · download PDF reports anytime
          </p>
        </div>
        <div style={{
          display: 'flex', gap: 8, fontSize: 13, fontWeight: 600, color: '#374151',
          background: 'white', padding: '10px 18px', borderRadius: 12,
          border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <span style={{ color: '#10b981' }}>{counts.completed} completed</span>
          <span style={{ color: '#d1d5db' }}>·</span>
          <span style={{ color: '#2563eb' }}>{counts.upcoming} upcoming</span>
          <span style={{ color: '#d1d5db' }}>·</span>
          <span style={{ color: '#a16207' }}>{counts.pending} pending</span>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { key: 'all',       label: `All (${counts.all})`,               color: '#374151' },
          { key: 'completed', label: `Completed (${counts.completed})`,   color: '#16a34a' },
          { key: 'upcoming',  label: `Upcoming (${counts.upcoming})`,     color: '#1d4ed8' },
          { key: 'pending',   label: `Pending (${counts.pending})`,       color: '#a16207' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '7px 18px', borderRadius: 24, border: '1.5px solid',
              fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.18s',
              borderColor: filter === tab.key ? tab.color : '#e5e7eb',
              background:  filter === tab.key ? tab.color : 'white',
              color:       filter === tab.key ? 'white'   : tab.color,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Empty state ── */}
      {filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '64px 24px',
          background: 'white', borderRadius: 16, border: '1.5px dashed #e5e7eb',
        }}>
          <i className="fas fa-calendar-times" style={{ fontSize: 48, color: '#d1d5db', display: 'block', marginBottom: 16 }}></i>
          <h3 style={{ margin: '0 0 8px', color: '#374151' }}>No appointments found</h3>
          <p style={{ color: '#9ca3af', margin: 0, fontSize: 14 }}>
            {filter === 'all' ? 'Book your first appointment to get started.' : `No ${filter} appointments.`}
          </p>
        </div>
      )}

      {/* ── Table (desktop) ── */}
      {filtered.length > 0 && (
        <>
          {/* Desktop table */}
          <div style={{
            background: 'white', borderRadius: 16, border: '1.5px solid #e5e7eb',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden',
            display: 'block',
          }}
            className="appt-table-wrapper"
          >
            <style>{`
              @media (max-width: 640px) {
                .appt-desktop-table { display: none !important; }
                .appt-mobile-cards  { display: flex !important; }
              }
              @media (min-width: 641px) {
                .appt-desktop-table { display: table !important; }
                .appt-mobile-cards  { display: none !important; }
              }
              .appt-row:hover { background: #f8faff !important; }
              .pdf-btn:hover { background: linear-gradient(135deg,#2563eb,#7c3aed) !important; color: white !important; border-color: transparent !important; }
              .pdf-btn:hover i { color: white !important; }
            `}</style>

            <table className="appt-desktop-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg,#eff6ff,#f5f3ff)' }}>
                  {['Date', 'Time', 'Doctor', 'Problem', 'Status', 'Follow-up', 'PDF Report'].map(h => (
                    <th key={h} style={{
                      padding: '13px 16px', textAlign: 'left',
                      fontSize: 11, fontWeight: 700, color: '#6b7280',
                      textTransform: 'uppercase', letterSpacing: 0.5,
                      borderBottom: '1.5px solid #e5e7eb',
                      whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((appt, i) => {
                  const st  = getStatusBadge(appt)
                  const hasRecord = appt.diagnosis || appt.doctorNotes || appt.tests || appt.linkedPrescriptions.length > 0
                  return (
                    <tr key={appt.id} className="appt-row" style={{
                      borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none',
                      background: 'white', transition: 'background 0.15s',
                    }}>
                      {/* Date */}
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
                          {appt.apptTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                          {appt.apptTime.getFullYear()}
                        </div>
                      </td>

                      {/* Time */}
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          background: '#f0f9ff', border: '1px solid #bae6fd',
                          borderRadius: 8, padding: '4px 10px',
                          fontSize: 12, fontWeight: 700, color: '#0369a1',
                        }}>
                          <i className="fas fa-clock" style={{ fontSize: 10 }}></i>
                          {appt.apptTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Doctor */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#1e40af' }}>
                          Dr. {appt.doctor?.name || `#${appt.doctorId}`}
                        </div>
                        {appt.doctor?.specialization && (
                          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                            {appt.doctor.specialization}
                          </div>
                        )}
                      </td>

                      {/* Problem / Symptoms */}
                      <td style={{ padding: '14px 16px', maxWidth: 160 }}>
                        <div style={{
                          fontSize: 12, color: '#374151',
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap', maxWidth: 150,
                        }}
                          title={appt.symptoms || 'Consultation'}
                        >
                          {appt.symptoms || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Consultation</span>}
                        </div>
                        {appt.diagnosis && (
                          <div style={{ fontSize: 11, color: '#2563eb', marginTop: 3, fontWeight: 600 }}>
                            <i className="fas fa-stethoscope" style={{ marginRight: 3, fontSize: 9 }}></i>
                            Dx saved
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <span style={badge(st.label, st.bg, st.color, st.border)}>
                          {st.label === 'Completed' && <i className="fas fa-check" style={{ fontSize: 9 }}></i>}
                          {st.label === 'Upcoming'  && <i className="fas fa-clock" style={{ fontSize: 9 }}></i>}
                          {st.label === 'Pending'   && <i className="fas fa-hourglass-half" style={{ fontSize: 9 }}></i>}
                          {st.label}
                        </span>
                      </td>

                      {/* Follow-up */}
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        {appt.followUpDate ? (
                          <div>
                            <div style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              background: '#f0fdf4', border: '1px solid #86efac',
                              borderRadius: 8, padding: '4px 10px',
                              fontSize: 12, fontWeight: 700, color: '#15803d',
                            }}>
                              <i className="fas fa-calendar-plus" style={{ fontSize: 10 }}></i>
                              {new Date(appt.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                            </div>
                            {appt.followUpInstructions && (
                              <div style={{ fontSize: 10, color: '#6b7280', marginTop: 3, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {appt.followUpInstructions}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: '#d1d5db' }}>—</span>
                        )}
                      </td>

                      {/* PDF */}
                      <td style={{ padding: '14px 16px' }}>
                        {hasRecord ? (
                          <button
                            className="pdf-btn"
                            onClick={() => handleDownloadPDF(appt)}
                            disabled={generatingPdf === appt.id}
                            title="Download full medical report as PDF"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb',
                              background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                              color: '#374151', transition: 'all 0.18s',
                              opacity: generatingPdf === appt.id ? 0.6 : 1,
                            }}
                          >
                            <i className={`fas ${generatingPdf === appt.id ? 'fa-spinner fa-spin' : 'fa-file-pdf'}`}
                              style={{ color: generatingPdf === appt.id ? '#6b7280' : '#ef4444', fontSize: 14 }} />
                            {generatingPdf === appt.id ? 'Generating…' : 'Download'}
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: '#d1d5db', fontStyle: 'italic' }}>
                            Record pending
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* ── Mobile cards ── */}
            <div className="appt-mobile-cards" style={{ flexDirection: 'column', gap: 12, padding: 12, display: 'none' }}>
              {filtered.map(appt => {
                const st        = getStatusBadge(appt)
                const hasRecord = appt.diagnosis || appt.doctorNotes || appt.tests || appt.linkedPrescriptions.length > 0
                return (
                  <div key={appt.id} style={{
                    border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '14px 16px',
                    background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  }}>
                    {/* Top row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: '#111827' }}>
                          {appt.apptTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                          {appt.apptTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span style={badge(st.label, st.bg, st.color, st.border)}>{st.label}</span>
                    </div>

                    {/* Doctor */}
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e40af', marginBottom: 4 }}>
                      <i className="fas fa-user-md" style={{ marginRight: 6, fontSize: 11 }}></i>
                      Dr. {appt.doctor?.name || `#${appt.doctorId}`}
                      {appt.doctor?.specialization && (
                        <span style={{ fontWeight: 400, color: '#6b7280' }}> · {appt.doctor.specialization}</span>
                      )}
                    </div>

                    {/* Symptoms */}
                    {appt.symptoms && (
                      <div style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>
                        <i className="fas fa-stethoscope" style={{ marginRight: 5, color: '#7c3aed', fontSize: 10 }}></i>
                        {appt.symptoms}
                      </div>
                    )}

                    {/* Follow-up */}
                    {appt.followUpDate && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: '#f0fdf4', border: '1px solid #86efac',
                        borderRadius: 8, padding: '3px 10px', marginBottom: 10,
                        fontSize: 11, fontWeight: 700, color: '#15803d',
                      }}>
                        <i className="fas fa-calendar-plus" style={{ fontSize: 9 }}></i>
                        Follow-up: {new Date(appt.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}

                    {/* PDF button */}
                    {hasRecord && (
                      <button
                        onClick={() => handleDownloadPDF(appt)}
                        disabled={generatingPdf === appt.id}
                        style={{
                          width: '100%', marginTop: 8,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          padding: '9px', borderRadius: 8,
                          background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
                          color: 'white', border: 'none', cursor: 'pointer',
                          fontWeight: 700, fontSize: 13,
                          opacity: generatingPdf === appt.id ? 0.7 : 1,
                        }}
                      >
                        <i className={`fas ${generatingPdf === appt.id ? 'fa-spinner fa-spin' : 'fa-file-pdf'}`} />
                        {generatingPdf === appt.id ? 'Generating PDF…' : 'Download Medical Report'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Table footer */}
          <div style={{
            marginTop: 12, fontSize: 12, color: '#9ca3af', textAlign: 'right',
          }}>
            Showing {filtered.length} of {enriched.length} appointments
          </div>
        </>
      )}
    </div>
  )
}