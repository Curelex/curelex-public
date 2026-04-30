const Doctor          = require('../models/Doctor')
const { validationResult } = require('express-validator')
const bcrypt          = require('bcryptjs')
const jwt             = require('jsonwebtoken')
const cloudinary      = require('../config/cloudinary')

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
/**
 * ✅ FIX: JWT payload includes role:'doctor' so that doctorAuth
 *          middleware can read req.user.role reliably on every request.
 *          Also returns verificationStatus + isActive fresh from DB
 *          so the frontend doesn't need a second round-trip on mount.
 */
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
        role:  'doctor',          // ✅ role is always 'doctor' in the token
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
        verificationStatus: doctor.verificationStatus, // fresh from DB
        isActive:           doctor.isActive,            // fresh from DB
        experience:         doctor.experience,
        hospital:           doctor.hospital || doctor.regState,
        mobile:             doctor.mobile,
      },
    })
  } catch (error) {
    next(error)
  }
}

/* ── TOGGLE ACTIVE  (PATCH /doctors/:id/active) ────────────────── */
/**
 * ✅ FIX: Always fetches fresh verificationStatus from DB.
 *          Never trusts the JWT for approval status.
 *          Returns { success: true } so the frontend optimistic-update
 *          logic can confirm the change was saved.
 */
exports.toggleActive = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id)
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' })

    // Only block going ACTIVE if not approved.
    // Going INACTIVE is always allowed regardless of status.
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
        'id', 'name', 'email', 'specialization', 'experience',
        'gender', 'regState', 'patientsHandeled',
        'photoUrl', 'verificationStatus', 'isActive', 'mobile',
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
        'id', 'name', 'email', 'specialization', 'experience',
        'gender', 'regState', 'patientsHandeled',
        'photoUrl', 'verificationStatus', 'isActive',
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

/* ── UPDATE PROFILE PHOTO ───────────────────────────────────────── */
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