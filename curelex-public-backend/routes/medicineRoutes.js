const express = require("express");
const router  = express.Router();
const { body } = require("express-validator");

const {
  addMedicine,
  getMedicines,
  addDoctorMedicine,
  getDoctorMedicines,
  deleteDoctorMedicine,
} = require("../controllers/medicineController");

const auth                          = require("../middleware/auth");
const { doctorOrAdminAuth, doctorAuth } = require("../middleware/role.middleware");

// ── Existing routes (unchanged) ───────────────────────────────
router.post(
  "/add",
  auth,
  doctorOrAdminAuth,
  [
    body("name").notEmpty().withMessage("Medicine name is required"),
    body("composition").notEmpty().withMessage("Composition is required"),
    body("dosageForm").notEmpty().withMessage("Dosage form is required"),
    body("manufacturer").notEmpty().withMessage("Manufacturer is required"),
  ],
  addMedicine
);

router.get("/all", auth, doctorOrAdminAuth, getMedicines);

// ── NEW: Doctor-specific routes ───────────────────────────────

// Doctor adds their own medicine (no manufacturer required)
router.post("/doctor/add", auth, doctorAuth, addDoctorMedicine);

// Get medicines for a specific doctor (own + global)
router.get("/doctor/:doctorId", auth, getDoctorMedicines);

// Doctor deletes their own medicine
router.delete("/doctor/:id", auth, doctorAuth, deleteDoctorMedicine);

module.exports = router;