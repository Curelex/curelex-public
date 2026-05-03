const express   = require('express')
const router    = express.Router()
const { body }  = require('express-validator')

const {
  uploadProfilePhoto,
  uploadQrCode,         // ✅ NEW
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
  updateQrCode,         // ✅ NEW
  updateProfile,
} = require('../controllers/doctorController')

const auth               = require('../middleware/auth')
const { doctorAuth }     = require('../middleware/role.middleware')

/* ── Public routes ────────────────────────────────────────────── */
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

/* ── Named routes MUST come before /:id ──────────────────────── */
router.get('/',    auth, getAllDoctors)
router.get('/all', auth, getApprovedDoctors)

/* ── Dynamic :id routes ───────────────────────────────────────── */
router.get('/:id',         auth,            getDoctorById)
router.put('/:id/profile', auth, doctorAuth, updateProfile)
router.patch('/:id/active', auth, doctorAuth, toggleActive)

// Profile photo upload
router.put(
  '/:id/photo',
  auth, doctorAuth,
  uploadProfilePhoto,
  handleUploadError,
  updateProfilePhoto
)

// QR code upload  ✅ NEW
router.put(
  '/:id/qr',
  auth, doctorAuth,
  uploadQrCode,
  handleUploadError,
  updateQrCode
)

module.exports = router