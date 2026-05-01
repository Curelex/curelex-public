const Appointment = require("../models/Appointment");
const Doctor      = require("../models/Doctor");
const User        = require("../models/User");
const { validationResult } = require("express-validator");
const { generateMeetingLink } = require("../utis/meetingLink");

// ================= BOOK APPOINTMENT =================
exports.bookAppointment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { patientId, doctorId, symptoms, appointmentTime } = req.body;

    const patientIdInt = parseInt(patientId, 10);
    const doctorIdInt  = parseInt(doctorId,  10);

    if (isNaN(patientIdInt) || isNaN(doctorIdInt)) {
      return res.status(400).json({ message: "Invalid patientId or doctorId" });
    }

    if (String(req.user.id) !== String(patientIdInt)) {
      return res.status(403).json({ message: "You can only book appointments for yourself." });
    }

    const patient = await User.findByPk(patientIdInt);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const doctor = await Doctor.findByPk(doctorIdInt);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (doctor.verificationStatus !== "approved") {
      return res.status(400).json({ message: "Doctor is not verified yet" });
    }

    const existingAppointment = await Appointment.findOne({
      where: { doctorId: doctorIdInt, appointmentTime },
    });

    if (existingAppointment) {
      return res.status(400).json({ message: "This time slot is already booked" });
    }

    const appointment = await Appointment.create({
      patientId:      patientIdInt,
      doctorId:       doctorIdInt,
      patientName:    patient.name,
      symptoms,
      appointmentTime,
      status:         "scheduled",
      doctorApproved: false,
    });

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET PATIENT APPOINTMENTS =================
exports.getAppointmentsByPatient = async (req, res, next) => {
  try {
    const appointments = await Appointment.findAll({
      where: { patientId: req.params.id },
      include: [
        {
          model: Doctor,
          as: "doctor",
          attributes: ["id", "name", "specialization", "photoUrl"],
        },
      ],
      order: [["appointmentTime", "ASC"]],
    });

    res.json({ success: true, count: appointments.length, appointments });
  } catch (error) {
    next(error);
  }
};

// ================= GET DOCTOR APPOINTMENTS =================
exports.getAppointmentsByDoctor = async (req, res, next) => {
  try {
    const appointments = await Appointment.findAll({
      where: { doctorId: req.params.id },
      include: [
        {
          model: User,
          as: "patient",
          attributes: ["id", "name", "email", "mobile"],
        },
      ],
      order: [["appointmentTime", "ASC"]],
    });

    const enriched = appointments.map((a) => {
      const plain = a.toJSON();
      plain.patientName =
        plain.patientName ||
        plain.patient?.name ||
        `Patient #${plain.patientId}`;
      return plain;
    });

    res.json({ success: true, count: enriched.length, appointments: enriched });
  } catch (error) {
    next(error);
  }
};

// ================= UPDATE APPOINTMENT STATUS =================
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const validStatuses = ["scheduled", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    appointment.status = status;
    await appointment.save();

    res.json({ message: "Status updated successfully", appointment });
  } catch (error) {
    next(error);
  }
};

// ================= GET PENDING APPOINTMENTS (for doctor) =================
exports.getPendingAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      where: {
        doctorId:       req.params.doctorId,
        doctorApproved: false,
        status:         "scheduled",
      },
      include: [
        {
          model: User,
          as: "patient",
          attributes: ["id", "name", "email", "mobile"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const enriched = appointments.map((a) => {
      const plain = a.toJSON();
      plain.patientName =
        plain.patientName ||
        plain.patient?.name ||
        `Patient #${plain.patientId}`;
      return plain;
    });

    res.json({ success: true, appointments: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= GET APPROVED PATIENTS STATS =================
exports.getApprovedPatients = async (req, res) => {
  try {
    const approved = await Appointment.findAll({
      where: { doctorId: req.params.doctorId, doctorApproved: true },
      attributes: ["patientId"],
    });

    const uniquePatients = [...new Set(approved.map((a) => a.patientId))];

    res.json({
      success:         true,
      totalApproved:   approved.length,
      patientsHandled: uniquePatients.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= APPROVE APPOINTMENT =================
exports.approveAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        { model: User, as: "patient", attributes: ["id", "name"] },
      ],
    });
    if (!appointment) return res.status(404).json({ message: "Not found" });

    if (String(appointment.doctorId) !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only approve your own appointments." });
    }

    const meetingLink = generateMeetingLink(
      appointment.id,
      appointment.doctorId,
      appointment.patientId
    );

    appointment.doctorApproved = true;
    appointment.meetingLink    = meetingLink;
    await appointment.save();

    const plain = appointment.toJSON();
    plain.patientName =
      plain.patientName || plain.patient?.name || `Patient #${plain.patientId}`;

    res.json({
      success:     true,
      message:     "Appointment approved",
      appointment: plain,
      meetingLink,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= SAVE APPOINTMENT NOTES =================
// PATCH /appointments/:id/notes
exports.saveAppointmentNotes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description, note, followUp, tests, followUpInstructions } = req.body;

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    await appointment.update({
      diagnosis:            description    || null,
      doctorNotes:          note           || null,
      followUpDate:         followUp       || null,
      followUpInstructions: followUpInstructions || null,
      tests:                tests && tests.length > 0 ? JSON.stringify(tests) : null,
    });

    res.json({ success: true, message: "Appointment notes saved", appointment });
  } catch (error) {
    next(error);
  }
};