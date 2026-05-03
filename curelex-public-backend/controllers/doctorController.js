const Doctor               = require('../models/Doctor')
const { validationResult } = require('express-validator')
const bcrypt               = require('bcryptjs')
const jwt                  = require('jsonwebtoken')
const cloudinary           = require('../config/cloudinary')

async function destroyFile(publicId, resourceType = 'image') {
  if (!publicId) return
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }).catch(() => {})
}

/* ── REGISTER ──────────────────────────────────────────────────── */
exports.registerDoctor = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { name, email, password } = req.body
    const existing = await Doctor.findOne({ where: { email } })
    if (existing) return res.status(400).json({ message: 'Doctor with this email already exists' })

    const hashedPassword = await bcrypt.hash(password, 10)
    const doctor = await Doctor.create({ name, email, password: hashedPassword })

    res.status(201).json({ message: 'Doctor registered successfully', doctor })
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError')
      return res.status(400).json({ message: 'Doctor with this email already exists' })
    next(error)
  }
}

/* ── LOGIN ─────────────────────────────────────────────────────── */
exports.loginDoctor = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const doctor = await Doctor.findOne({ where: { email } })
    if (!doctor) return res.status(400).json({ message: 'Invalid credentials' })

    const isMatch = await bcrypt.compare(password, doctor.password)
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' })

    const token = jwt.sign(
      {
        id:    doctor.id,
        name:  doctor.name,
        email: doctor.email,
        role:  'doctor',
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      token,
      doctor: {
        id:                 doctor.id,
        name:               doctor.name,
        email:              doctor.email,
        specialization:     doctor.specialization,
        photoUrl:           doctor.photoUrl,
        verificationStatus: doctor.verificationStatus,
        isActive:           doctor.isActive,
        experience:         doctor.experience,
        currentInstitute:   doctor.currentInstitute,
        mobile:             doctor.mobile,
      },
    })
  } catch (error) {
    next(error)
  }
}

/* ── TOGGLE ACTIVE  (PATCH /doctors/:id/active) ────────────────── */
exports.toggleActive = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id)
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' })

    if (req.body.isActive === true && doctor.verificationStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Only approved doctors can go active.',
        currentStatus: doctor.verificationStatus,
      })
    }

    doctor.isActive = req.body.isActive === true
    await doctor.save()

    res.json({
      success:  true,
      isActive: doctor.isActive,
      message:  doctor.isActive ? 'You are now Active' : 'You are now Inactive',
    })
  } catch (error) {
    next(error)
  }
}

/* ── GET ALL DOCTORS ────────────────────────────────────────────── */
exports.getAllDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.findAll({
      attributes: [
        'id', 'name', 'email', 'mobile', 'specialization', 'experience',
        'photoUrl', 'verificationStatus', 'isActive', 'profileComplete',
        'address', 'aadhaar', 'licenseNumber', 'qualification',
        'currentInstitute', 'certificateUrl',
        'bankName', 'accountHolderName', 'accountNumber', 'ifscCode',
        'qrCodeUrl',
        'createdAt',
      ],
      order: [
        ['verificationStatus', 'ASC'],
        ['isActive', 'DESC'],
        ['name', 'ASC'],
      ],
    })
    res.json({ success: true, count: doctors.length, doctors })
  } catch (error) {
    next(error)
  }
}

/* ── GET APPROVED ONLY ──────────────────────────────────────────── */
exports.getApprovedDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.findAll({
      where: { verificationStatus: 'approved' },
      attributes: [
        'id', 'name', 'email', 'mobile', 'specialization', 'experience',
        'photoUrl', 'verificationStatus', 'isActive', 'qualification',
        'currentInstitute', 'address', 'qrCodeUrl',
      ],
    })
    res.json({ success: true, count: doctors.length, doctors })
  } catch (error) {
    next(error)
  }
}

/* ── GET BY ID ──────────────────────────────────────────────────── */
exports.getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
    })
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' })
    res.json({ success: true, doctor })
  } catch (error) {
    next(error)
  }
}

/* ── UPDATE FULL PROFILE  (PUT /doctors/:id/profile) ───────────── */
exports.updateProfile = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id)
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' })

    if (String(req.user.id) !== String(doctor.id)) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    const allowed = [
      // Step 1
      'name', 'mobile', 'specialization',
      // Step 2
      'address', 'aadhaar', 'licenseNumber',
      'photoUrl', 'photoPublicId', 'certificateUrl', 'certificatePublicId',
      // Step 3
      'experience', 'qualification', 'currentInstitute',
      // Step 4
      'bankName', 'accountHolderName', 'accountNumber', 'ifscCode',
      'qrCodeUrl', 'qrCodePublicId',
    ]

    allowed.forEach(field => {
      if (req.body[field] !== undefined) doctor[field] = req.body[field]
    })

    doctor.profileComplete = true
    await doctor.save()

    const { password: _pw, ...safe } = doctor.toJSON()
    res.json({ success: true, doctor: safe })

  } catch (error) {
    // ✅ FIX: Handle unique constraint violation (e.g. mobile already taken)
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors?.[0]?.path || 'field'
      const fieldLabel = field === 'mobile' ? 'mobile number' : field
      return res.status(400).json({
        message: `This ${fieldLabel} is already registered with another account. Please use a different one.`
      })
    }
    // ✅ FIX: Handle other Sequelize validation errors with a clear message
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: error.errors?.[0]?.message || 'Validation error'
      })
    }
    next(error)
  }
}

/* ── UPDATE PROFILE PHOTO  (PUT /doctors/:id/photo) ────────────── */
exports.updateProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No photo uploaded' })

    const doctor = await Doctor.findByPk(req.params.id)
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' })

    await destroyFile(doctor.photoPublicId, 'image')
    doctor.photoUrl      = req.file.path
    doctor.photoPublicId = req.file.filename
    await doctor.save()

    res.json({ success: true, photoUrl: doctor.photoUrl })
  } catch (error) {
    await destroyFile(req.file?.filename, 'image')
    next(error)
  }
}

/* ── UPDATE QR CODE  (PUT /doctors/:id/qr) ─────────────────────── */
exports.updateQrCode = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No QR image uploaded' })

    const doctor = await Doctor.findByPk(req.params.id)
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' })

    // Delete old QR from Cloudinary if one exists
    await destroyFile(doctor.qrCodePublicId, 'image')

    doctor.qrCodeUrl      = req.file.path
    doctor.qrCodePublicId = req.file.filename
    await doctor.save()

    res.json({ success: true, qrCodeUrl: doctor.qrCodeUrl })
  } catch (error) {
    await destroyFile(req.file?.filename, 'image')
    next(error)
  }
}