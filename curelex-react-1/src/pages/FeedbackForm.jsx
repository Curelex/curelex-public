import { useState } from 'react'

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']
const RATING_COLORS = ['', '#ef4444', '#f97316', '#f59e0b', '#3b82f6', '#10b981']
const FEEDBACK_CATEGORIES = ['Doctor Experience', 'App Usability', 'Appointment Booking', 'Other']

export default function FeedbackForm({ onClose, doctorName = null }) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [category, setCategory] = useState('')
  const [feedbackText, setFeedbackText] = useState('')
  const [email, setEmail] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const activeRating = hovered || rating
  const activeColor = RATING_COLORS[activeRating] || '#d1d5db'

  const validate = () => {
    const e = {}
    if (!rating) e.rating = 'Please select a rating'
    if (!feedbackText.trim()) e.feedbackText = 'Please share your feedback'
    if (!anonymous && !email.trim()) e.email = 'Email is required'
    if (!anonymous && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = 'Enter a valid email address'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setSubmitting(true)

    // Simulate API call
    await new Promise(res => setTimeout(res, 1200))

    const payload = {
      rating,
      ratingLabel: RATING_LABELS[rating],
      category,
      feedbackText,
      email: anonymous ? null : email,
      anonymous,
      submittedAt: new Date().toISOString(),
    }
    console.log('Feedback submitted:', payload)

    setSubmitting(false)
    setSubmitted(true)
  }

  const handleReset = () => {
    setRating(0); setHovered(0); setCategory(''); setFeedbackText('')
    setEmail(''); setAnonymous(false); setSubmitted(false); setErrors({})
  }

  const StarIcon = ({ filled, color }) => (
    <svg viewBox="0 0 24 24" width="36" height="36" fill={filled ? color : 'none'}
      stroke={filled ? color : '#d1d5db'} strokeWidth="1.5" style={{ display: 'block', transition: 'all 0.15s' }}>
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  )

  if (submitted) {
    return (
      <div style={styles.overlay}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center', padding: '48px 32px' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: 32,
            }}>
              <i className="fas fa-check" style={{ color: 'white' }}></i>
            </div>
            <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 700, color: '#111827' }}>
              Thank you for your feedback!
            </h2>
            <p style={{ color: '#6b7280', fontSize: 15, margin: '0 0 8px' }}>
              You rated us <strong style={{ color: activeColor || RATING_COLORS[rating] }}>
                {RATING_LABELS[rating]}
              </strong>
              {' '}({rating}/5 stars)
            </p>
            <p style={{ color: '#9ca3af', fontSize: 13, margin: '0 0 32px' }}>
              Your response helps us improve the experience for everyone.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleReset}
                style={{ ...styles.btnSecondary }}>
                <i className="fas fa-redo" style={{ marginRight: 6 }}></i>Submit Another
              </button>
              {onClose && (
                <button onClick={onClose} style={{ ...styles.btnPrimary }}>
                  <i className="fas fa-times" style={{ marginRight: 6 }}></i>Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>
              <i className="fas fa-comment-alt" style={{ marginRight: 10, color: '#2563eb' }}></i>
              Feedback Form
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>
              {doctorName
                ? `Share your experience with Dr. ${doctorName}`
                : 'Please share your opinion about our service'}
            </p>
          </div>
          {onClose && (
            <button onClick={onClose} style={styles.closeBtn}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        <div style={styles.body}>
          {/* Star Rating */}
          <div style={styles.field}>
            <label style={styles.label}>
              <i className="fas fa-star" style={{ marginRight: 6, color: '#f59e0b' }}></i>
              Rate our services!
            </label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n}
                  onClick={() => { setRating(n); setErrors(e => ({ ...e, rating: undefined })) }}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                    transform: activeRating >= n ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 0.15s',
                  }}>
                  <StarIcon filled={activeRating >= n} color={RATING_COLORS[activeRating] || '#f59e0b'} />
                </button>
              ))}
              {activeRating > 0 && (
                <span style={{
                  marginLeft: 8, fontSize: 13, fontWeight: 600,
                  color: RATING_COLORS[activeRating],
                  background: `${RATING_COLORS[activeRating]}18`,
                  padding: '3px 10px', borderRadius: 20,
                  transition: 'all 0.2s',
                }}>
                  {RATING_LABELS[activeRating]}
                </span>
              )}
            </div>
            {errors.rating && <p style={styles.error}><i className="fas fa-exclamation-circle" style={{ marginRight: 4 }}></i>{errors.rating}</p>}
          </div>

          {/* Category */}
          <div style={styles.field}>
            <label style={styles.label}>
              <i className="fas fa-tag" style={{ marginRight: 6, color: '#2563eb' }}></i>
              Feedback category <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FEEDBACK_CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(cat => cat === c ? '' : c)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: category === c ? '#2563eb' : 'white',
                    color: category === c ? 'white' : '#374151',
                    border: `1.5px solid ${category === c ? '#2563eb' : '#e5e7eb'}`,
                  }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Text */}
          <div style={styles.field}>
            <label style={styles.label}>
              <i className="fas fa-align-left" style={{ marginRight: 6, color: '#2563eb' }}></i>
              What can be improved?
            </label>
            <textarea
              value={feedbackText}
              onChange={e => { setFeedbackText(e.target.value); setErrors(err => ({ ...err, feedbackText: undefined })) }}
              placeholder="Let us know what can be done better..."
              rows={4}
              style={{
                ...styles.input,
                resize: 'vertical', minHeight: 100,
                borderColor: errors.feedbackText ? '#ef4444' : '#e5e7eb',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              {errors.feedbackText
                ? <p style={styles.error}><i className="fas fa-exclamation-circle" style={{ marginRight: 4 }}></i>{errors.feedbackText}</p>
                : <span />}
              <span style={{ fontSize: 11, color: feedbackText.length > 480 ? '#ef4444' : '#9ca3af' }}>
                {feedbackText.length}/500
              </span>
            </div>
          </div>

          {/* Anonymous toggle */}
          <div style={{ ...styles.field, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => { setAnonymous(a => !a); setErrors(e => ({ ...e, email: undefined })) }}
              style={{
                width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: anonymous ? '#2563eb' : '#e5e7eb',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
              }}>
              <span style={{
                position: 'absolute', top: 3, left: anonymous ? 21 : 3,
                width: 18, height: 18, borderRadius: '50%', background: 'white',
                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </button>
            <div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Submit anonymously</span>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af' }}>Your email won't be stored or shared</p>
            </div>
          </div>

          {/* Email */}
          {!anonymous && (
            <div style={styles.field}>
              <label style={styles.label}>
                <i className="fas fa-envelope" style={{ marginRight: 6, color: '#2563eb' }}></i>
                Your email
              </label>
              <div style={{
                display: 'flex', alignItems: 'center',
                border: `1.5px solid ${errors.email ? '#ef4444' : '#e5e7eb'}`,
                borderRadius: 10, overflow: 'hidden', background: 'white',
              }}>
                <span style={{
                  padding: '0 12px', color: '#9ca3af', borderRight: '1.5px solid #e5e7eb',
                  height: 42, display: 'flex', alignItems: 'center', fontSize: 14, flexShrink: 0,
                }}>@</span>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(err => ({ ...err, email: undefined })) }}
                  placeholder="Your email address"
                  style={{ flex: 1, border: 'none', padding: '10px 12px', fontSize: 14, outline: 'none', color: '#111827', background: 'transparent' }}
                />
              </div>
              {errors.email && <p style={styles.error}><i className="fas fa-exclamation-circle" style={{ marginRight: 4 }}></i>{errors.email}</p>}
            </div>
          )}

          {/* Submit */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #f0f0f0', marginTop: 4 }}>
            {onClose && (
              <button onClick={onClose} style={styles.btnSecondary}>Cancel</button>
            )}
            <button onClick={handleSubmit} disabled={submitting} style={{ ...styles.btnPrimary, opacity: submitting ? 0.75 : 1 }}>
              {submitting
                ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 6 }}></i>Submitting...</>
                : <><i className="fas fa-paper-plane" style={{ marginRight: 6 }}></i>Submit Feedback</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    minHeight: '100vh',
    background: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: 'Inter, sans-serif',
  },
  card: {
    background: 'white',
    borderRadius: 20,
    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
    width: '100%',
    maxWidth: 520,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '24px 28px 0',
    gap: 12,
  },
  body: {
    padding: '20px 28px 28px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1.5px solid #e5e7eb',
    borderRadius: 10,
    fontSize: 14,
    color: '#111827',
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box',
    background: 'white',
  },
  error: {
    margin: 0,
    fontSize: 12,
    color: '#ef4444',
    fontWeight: 500,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#9ca3af',
    fontSize: 16,
    padding: 6,
    borderRadius: 8,
    flexShrink: 0,
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    padding: '11px 24px',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
  },
  btnSecondary: {
    background: 'white',
    color: '#6b7280',
    border: '1.5px solid #e5e7eb',
    borderRadius: 10,
    padding: '11px 20px',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
  },
}