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
 * doctorAuth
 *
 * ✅ FIX 1 — role check uses JWT (req.user.role) which is set at login.
 *             This was already correct but relied on login() passing
 *             role:'doctor' in the token — confirmed it does.
 *
 * ✅ FIX 2 — ownership check: doctor can only touch their OWN record.
 *             Was correct but added clearer error message.
 *
 * ✅ FIX 3 — NO approval check here. Approval is checked inside the
 *             controller (toggleActive) so the middleware itself never
 *             returns 403 for an approved doctor who has the right role
 *             and the right id. Previously nothing was wrong here, but
 *             the bug was that doctor.id was undefined on the frontend
 *             causing the URL to be /doctors/undefined/active which
 *             failed the ownership check below.
 */
exports.doctorAuth = async (req, res, next) => {
  try {
    // 1. Role must be 'doctor' (comes from JWT payload set at login)
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Doctor access only.' })
    }

    // 2. Ownership — doctor can only modify their own record
    //    req.params.id is the :id from the URL
    //    req.user.id   is from the verified JWT
    if (req.params.id && String(req.params.id) !== String(req.user.id)) {
      return res.status(403).json({
        message: 'Forbidden — you can only modify your own profile.',
      })
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