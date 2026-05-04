const Doctor = require("../models/Doctor");

/* ── GET ALL PENDING ────────────────────────────────────────────── */
exports.getPendingDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.findAll({
      where: { verificationStatus: "pending" },
    });
    res.json(doctors);
  } catch (error) {
    next(error);
  }
};

/* ── APPROVE  (POST /admin/approve/:id)  ✅ NOW ACCEPTS FEE ─────── */
/**
 * Body: { consultationFee: number }   (optional — defaults to 500 if omitted)
 *
 * The admin enters the fee in the modal before clicking Approve.
 * The fee is saved to doctor.consultationFee and shown on the
 * doctor dashboard as their per-consultation earnings.
 */
exports.approveDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const fee = req.body.consultationFee
      ? Number(req.body.consultationFee)
      : (doctor.consultationFee || 500);

    if (isNaN(fee) || fee < 0) {
      return res.status(400).json({ message: "Invalid consultation fee" });
    }

    doctor.verificationStatus = "approved";
    doctor.consultationFee   = fee;
    await doctor.save();

    res.json({ message: "Doctor Approved", doctor });
  } catch (error) {
    next(error);
  }
};

/* ── REJECT  (POST /admin/reject/:id) ──────────────────────────── */
exports.rejectDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    doctor.verificationStatus = "rejected";
    await doctor.save();

    res.json({ message: "Doctor Rejected", doctor });
  } catch (error) {
    next(error);
  }
};

/* ── UPDATE FEE ONLY  (PATCH /admin/fee/:id)  ✅ NEW ───────────── */
/**
 * Lets admin update the fee for an already-approved doctor
 * without going through the full approve flow again.
 * Body: { consultationFee: number }
 */
exports.updateConsultationFee = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const fee = Number(req.body.consultationFee);
    if (isNaN(fee) || fee < 0) {
      return res.status(400).json({ message: "Invalid consultation fee" });
    }

    doctor.consultationFee = fee;
    await doctor.save();

    res.json({ success: true, consultationFee: doctor.consultationFee, doctor });
  } catch (error) {
    next(error);
  }
};