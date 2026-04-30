const express = require('express')
const router  = express.Router()
const { body } = require('express-validator')

const {
  uploadProfilePhoto,
  handleUploadError,
} = require('../middleware/upload')

const {
  registerDoctor,
  loginDoctor,
  getAllDoctors,
  getApprovedDoctors,
  getDoctorById,
  toggleActive,
  updateProfilePhoto,
} = require('../controllers/doctorController')

const auth                    = require('../middleware/auth')
const { doctorAuth }          = require('../middleware/role.middleware')

/* ── Public routes (no token needed) ──────────────────────────── */
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  ],
  registerDoctor
)

router.post('/login', loginDoctor)

/* ── Named routes MUST come before /:id ───────────────────────── */

// All doctors (for admin / patient search)
router.get('/', auth, getAllDoctors)

// Approved doctors only
router.get('/all', auth, getApprovedDoctors)

/* ── Dynamic :id routes ────────────────────────────────────────── */

// GET a single doctor by id (used by dashboard fetchFreshProfile)
router.get('/:id', auth, getDoctorById)

/**
 * PATCH /doctors/:id/active
 *
 * Doctor toggles their own online/offline status.
 *
 * Middleware chain:
 *   auth       → verifies JWT, sets req.user = { id, name, email, role }
 *   doctorAuth → checks role === 'doctor' AND req.params.id === req.user.id
 *   toggleActive (controller) → checks verificationStatus from DB
 *
 * ✅ This was returning 403 because on the frontend doctor.id was
 *    undefined (login() was called without the 'doctor' role arg,
 *    and the stored user object was not being read correctly).
 *    Now that AuthContext.js and DoctorLogin.jsx are fixed, the
 *    correct numeric id is always present in the URL.
 */
router.patch('/:id/active', auth, doctorAuth, toggleActive)

// PUT /doctors/:id/photo
router.put(
  '/:id/photo',
  auth,
  doctorAuth,
  uploadProfilePhoto,
  handleUploadError,
  updateProfilePhoto
)

module.exports = router