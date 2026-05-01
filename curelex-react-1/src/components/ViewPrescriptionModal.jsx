import { formatDate, parseMedicines } from '../utils/helpers'

export default function ViewPrescriptionModal({ prescription, onClose }) {
  if (!prescription) return null

  const doctorLabel = prescription.doctorName
    ? `Dr. ${prescription.doctorName}`
    : prescription.doctorId ? `Dr. #${prescription.doctorId}` : 'Doctor'

  const medicines = parseMedicines(prescription.medicines)

  return (
    <div className="modal active" id="viewPrescriptionModal">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-container" style={{ maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        <div className="appointment-modal-header">
          <i className="fas fa-prescription-bottle-alt"></i>
          <h2>Prescription</h2>
          <p>Issued: {formatDate(prescription.createdAt)} · {doctorLabel}
            {prescription.department ? ` · ${prescription.department}` : ''}
          </p>
        </div>

        <div style={{ padding: '0 1.5rem 1.5rem' }}>

          {/* ── Medicines Table ── */}
          {medicines.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: 8, fontSize: 13 }}>Medicine</th>
                  <th style={{ padding: 8, fontSize: 13 }}>Dosage</th>
                  <th style={{ padding: 8, fontSize: 13 }}>Frequency</th>
                  <th style={{ padding: 8, fontSize: 13 }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((m, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: 8, fontWeight: 500 }}>{m.name}</td>
                    <td style={{ padding: 8 }}>{m.dosage || '-'}</td>
                    <td style={{ padding: 8 }}>{m.frequency || '-'}</td>
                    <td style={{ padding: 8 }}>{m.duration || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              No medicines prescribed.
            </p>
          )}

          {/* ── Diagnosis ── */}
          {prescription.diagnosis && (
            <div style={{
              background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 10,
            }}>
              <strong style={{ fontSize: 13 }}>
                <i className="fas fa-stethoscope" style={{ marginRight: 6, color: '#2563eb' }}></i>
                Diagnosis:
              </strong>
              <p style={{ margin: '4px 0 0', fontSize: 13 }}>{prescription.diagnosis}</p>
            </div>
          )}

          {/* ── Tests ── */}
          {(() => {
            let tests = prescription.tests
            if (typeof tests === 'string') { try { tests = JSON.parse(tests) } catch { tests = [] } }
            return Array.isArray(tests) && tests.length > 0 ? (
              <div style={{
                background: 'rgba(8,145,178,0.06)', border: '1px solid rgba(8,145,178,0.15)',
                borderRadius: 8, padding: '10px 14px', marginBottom: 10,
              }}>
                <strong style={{ fontSize: 13 }}>
                  <i className="fas fa-flask" style={{ marginRight: 6, color: '#0891b2' }}></i>
                  Tests Ordered:
                </strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {tests.map((t, i) => (
                    <span key={i} style={{
                      background: '#ecfeff', border: '1px solid #a5f3fc',
                      borderRadius: 8, padding: '3px 10px', fontSize: 12,
                      color: '#0e7490', fontWeight: 600,
                    }}>
                      {t.name}
                      {t.type && (
                        <span style={{ fontSize: 10, marginLeft: 5, background: '#cffafe', padding: '1px 5px', borderRadius: 10 }}>
                          {t.type}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ) : null
          })()}

          {/* ── Follow Up ── */}
          {prescription.followUpDate && (
            <div style={{
              background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <i className="fas fa-calendar-check" style={{ color: '#10b981', fontSize: 14 }}></i>
              <div>
                <strong style={{ fontSize: 13, color: '#065f46' }}>
                  Follow-up: {formatDate(prescription.followUpDate)}
                </strong>
                {prescription.followUpInstructions && (
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>
                    {prescription.followUpInstructions}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Notes ── */}
          {prescription.notes && (
            <div style={{
              background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
              borderRadius: 8, padding: '10px 14px',
            }}>
              <strong style={{ fontSize: 13 }}>
                <i className="fas fa-sticky-note" style={{ marginRight: 6 }}></i>
                Notes:
              </strong>
              <p style={{ margin: '4px 0 0', fontSize: 13 }}>{prescription.notes}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}