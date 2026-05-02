const Medicine = require("../models/Medicine");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize");

// ── Existing: Admin adds global medicine ──────────────────────
exports.addMedicine = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { name, composition, dosageForm, manufacturer } = req.body;
    const medicine = await Medicine.create({ name, composition, dosageForm, manufacturer });

    res.status(201).json({ message: "Medicine added successfully", medicine });
  } catch (error) {
    next(error);
  }
};

// ── Existing: Get all global medicines ────────────────────────
exports.getMedicines = async (req, res, next) => {
  try {
    const medicines = await Medicine.findAll();
    res.json(medicines);
  } catch (error) {
    next(error);
  }
};

// ── NEW: Doctor adds their own medicine ───────────────────────
exports.addDoctorMedicine = async (req, res, next) => {
  try {
    const { name, composition, dosageForm, doctorId } = req.body;
    if (!name) return res.status(400).json({ message: "Medicine name is required" });

    const medicine = await Medicine.create({
      name,
      composition:  composition  || null,
      dosageForm:   dosageForm   || "Tablet",
      manufacturer: null,
      doctorId:     doctorId     || req.user.id
    });

    res.status(201).json({ success: true, medicine });
  } catch (error) {
    next(error);
  }
};

// ── NEW: Get medicines for a specific doctor (own + global) ───
exports.getDoctorMedicines = async (req, res, next) => {
  try {
    const medicines = await Medicine.findAll({
      where: {
        [Op.or]: [
          { doctorId: req.params.doctorId },  // doctor's own
          { doctorId: null }                   // global medicines
        ]
      },
      order: [
        ["doctorId", "DESC"],  // doctor's own medicines appear first
        ["name",     "ASC"]
      ]
    });
    res.json({ success: true, medicines });
  } catch (error) {
    next(error);
  }
};

// ── NEW: Delete doctor's own medicine ─────────────────────────
exports.deleteDoctorMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findByPk(req.params.id);
    if (!medicine) return res.status(404).json({ message: "Medicine not found" });

    // Only allow deleting own medicines
    if (medicine.doctorId != req.user.id)
      return res.status(403).json({ message: "Cannot delete this medicine" });

    await medicine.destroy();
    res.json({ success: true, message: "Medicine deleted" });
  } catch (error) {
    next(error);
  }
};