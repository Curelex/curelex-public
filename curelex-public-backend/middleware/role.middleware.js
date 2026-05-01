const User   = require('../models/User')
const Doctor = require('../models/Doctor')

/* ─── Admin ──────────────────────────────────────────────────── */
exports.adminAuth = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id)
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }
    next()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/* ─── Doctor ─────────────────────────────────────────────────── */
/**
 * ✅ FIX: Removed the ownership check entirely from doctorAuth.
 *
 * The old check was:
 *   if (req.params.id && String(req.params.id) !== String(req.user.id))
 *
 * This caused a FALSE 403 on routes like:
 *   PATCH /appointments/:id/approve   ← :id is appointmentId, NOT doctorId
 *   GET   /appointments/doctor/:id    ← :id IS doctorId, this was fine
 *
 * Since appointment routes use :id for appointmentId and :doctorId for
 * doctorId, a single ownership check in middleware cannot work for both.
 * Ownership is verified inside the controllers where needed.
 *
 * Role check (req.user.role === 'doctor') is sufficient here.
 */
exports.doctorAuth = async (req, res, next) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Doctor access only.' })
    }
    next()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/* ─── Patient ────────────────────────────────────────────────── */
exports.patientAuth = (req, res, next) => {
  if (req.user.role !== 'patient') {
    return res.status(403).json({ message: 'Patient access only.' })
  }
  next()
}

/* ─── Doctor OR Admin ────────────────────────────────────────── */
exports.doctorOrAdminAuth = async (req, res, next) => {
  try {
    const { role } = req.user
    if (role !== 'doctor' && role !== 'admin') {
      return res.status(403).json({ message: 'Doctor or Admin access only.' })
    }
    next()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}