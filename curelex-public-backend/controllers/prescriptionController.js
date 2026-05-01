const Prescription = require("../models/Prescription");
const Doctor       = require("../models/Doctor");
const { validationResult } = require("express-validator");

// POST /prescriptions/add
exports.addPrescription = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { patientId, doctorId, appointmentId, medicines, notes } = req.body;

    const prescription = await Prescription.create({
      patientId,
      doctorId,
      appointmentId: appointmentId || null,
      medicines,
      notes,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Prescription added successfully",
      prescription,
    });
  } catch (error) {
    next(error);
  }
};

// GET /prescriptions/patient/:id
exports.getPrescriptionsByPatient = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.findAll({
      where: { patientId: req.params.id },
      include: [
        {
          model: Doctor,
          as: "doctor",                          // ✅ join doctor so patient sees name
          attributes: ["id", "name", "specialization"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // ✅ Flatten doctor name + department into each prescription
    const enriched = prescriptions.map(p => {
      const plain      = p.toJSON();
      plain.doctorName = plain.doctor?.name           || null;
      plain.department = plain.doctor?.specialization || null;
      return plain;
    });

    res.json({ success: true, count: enriched.length, prescriptions: enriched });
  } catch (error) {
    next(error);
  }
};

// GET /prescriptions/doctor/:id
exports.getPrescriptionsByDoctor = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.findAll({
      where: { doctorId: req.params.id },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      count: prescriptions.length,
      prescriptions,
    });
  } catch (error) {
    next(error);
  }
};