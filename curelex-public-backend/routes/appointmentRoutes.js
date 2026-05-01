const express = require("express");
const router  = express.Router();
const { body } = require("express-validator");
const auth = require("../middleware/auth");   // ✅ correct import

const {
  bookAppointment,
  getAppointmentsByPatient,
  getAppointmentsByDoctor,
  updateAppointmentStatus,
  getPendingAppointments,
  getApprovedPatients,
  approveAppointment,
  saveAppointmentNotes,
} = require("../controllers/appointmentController");

// Book
router.post(
  "/",
  auth,
  [
    body("patientId").notEmpty(),
    body("doctorId").notEmpty(),
    body("appointmentTime").notEmpty(),
  ],
  bookAppointment
);

// Patient's appointments
router.get("/patient/:id", auth, getAppointmentsByPatient);

// Doctor's appointments (all)
router.get("/doctor/:id", auth, getAppointmentsByDoctor);

// Doctor's pending appointments
router.get("/doctor/:doctorId/pending", auth, getPendingAppointments);

// Doctor's approved patients stats
router.get("/doctor/:doctorId/approved", auth, getApprovedPatients);

// Update status
router.put("/status/:id", auth, updateAppointmentStatus);

// Approve appointment
router.patch("/:id/approve", auth, approveAppointment);

// ✅ Save doctor notes / diagnosis / tests / follow-up
router.patch("/:id/notes", auth, saveAppointmentNotes);

module.exports = router;