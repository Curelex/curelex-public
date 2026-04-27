const Doctor = require("../models/Doctor");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");

// ================= REGISTER DOCTOR =================

async function destroyFile(publicId, resourceType = "image") {
  if (!publicId) return;
  await cloudinary.uploader
    .destroy(publicId, { resource_type: resourceType })
    .catch(() => {});
}


exports.registerDoctor = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    
    const {
      name, email, password
    } = req.body;

    const existing = await Doctor.findOne({ where: { email } });
    if (existing) {
      
      return res.status(400).json({ message: "Doctor with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const doctor = await Doctor.create({
      name, email,
      password:            hashedPassword,
      
    });

    res.status(201).json({ message: "Doctor registered successfully", doctor });

  } catch (error) {
    
    if (error.name === "SequelizeUniqueConstraintError")
      return res.status(400).json({ message: "Doctor with this email already exists" });
    next(error);
  }
};

// ── Login ─────────────────────────────────────────────────────────
exports.loginDoctor = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const doctor = await Doctor.findOne({ where: { email } });
    if (!doctor)
      return res.status(400).json({ message: "Invalid credentials" });
    // if (doctor.verificationStatus !== "approved")
    //   return res.status(403).json({ message: "Account not approved yet" });
    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });
    const token = jwt.sign(
      { id: doctor.id, name: doctor.name, email: doctor.email, role: "doctor" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ success: true, token, doctor: {
      id: doctor.id, name: doctor.name,
      email: doctor.email, specialization: doctor.specialization,
      photoUrl: doctor.photoUrl
    }});
  } catch (error) { next(error); }
};

// ── Get by ID ─────────────────────────────────────────────────────
exports.getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({ success: true, doctor });
  } catch (error) { next(error); }
};

// ── Get all doctors (for telemedicine dropdown) ───────────────────
exports.getAllDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.findAll();
    res.json({ success: true, doctors });
  } catch (error) { next(error); }
};

// ── Get approved doctors ──────────────────────────────────────────
exports.getApprovedDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.findAll({ where: { verificationStatus: "approved" } });
    res.json({ success: true, count: doctors.length, doctors });
  } catch (error) { next(error); }
};

// ── Update profile photo ──────────────────────────────────────────
exports.updateProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No photo uploaded" });
    const doctor = await Doctor.findByPk(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    await destroyFile(doctor.photoPublicId, "image");  // delete old photo
    doctor.photoUrl      = req.file.path;
    doctor.photoPublicId = req.file.filename;
    await doctor.save();
    res.json({ success: true, photoUrl: doctor.photoUrl });
  } catch (error) {
    await destroyFile(req.file?.filename, "image");
    next(error);
  }
};