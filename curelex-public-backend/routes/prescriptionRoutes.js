const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const {
  addPrescription,
  getPrescriptionsByPatient,
  getPrescriptionsByDoctor,
} = require("../controllers/prescriptionController");

router.post(
  "/add",
  [
    body("patientId").notEmpty().withMessage("Patient ID is required"),
    body("doctorId").notEmpty().withMessage("Doctor ID is required"),
    body("medicines").isArray({ min: 1 }).withMessage("Medicines array is required"),
    body("medicines.*.name").notEmpty().withMessage("Medicine name required"),
    // dosage & duration optional — doctor may not fill both always
  ],
  addPrescription
);

router.get("/patient/:id", getPrescriptionsByPatient);
router.get("/doctor/:id", getPrescriptionsByDoctor);

module.exports = router;