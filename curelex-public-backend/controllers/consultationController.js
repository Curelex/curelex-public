const ConsultationRequest = require("../models/ConsultationRequest");

/* ── CREATE  (POST /api/consultations) — PUBLIC ── */
exports.createRequest = async (req, res, next) => {
  try {
    const { fullName, phoneCode, mobile, email, state, service } = req.body;

    if (!fullName || !mobile || !email || !state || !service) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const request = await ConsultationRequest.create({
      fullName,
      phoneCode: phoneCode || "+91",
      mobile,
      email,
      state,
      service,
    });

    return res.status(201).json({
      message: "Request submitted successfully",
      request,
    });
  } catch (error) {
    next(error);
  }
};

/* ── GET ALL  (GET /api/consultations) — ADMIN ── */
exports.getAllRequests = async (req, res, next) => {
  try {
    const requests = await ConsultationRequest.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

/* ── UPDATE  (PATCH /api/consultations/:id) — ADMIN ── */
exports.updateRequest = async (req, res, next) => {
  try {
    const request = await ConsultationRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const { status, adminNote } = req.body;
    if (status !== undefined)    request.status    = status;
    if (adminNote !== undefined) request.adminNote = adminNote;
    await request.save();

    res.json({ success: true, request });
  } catch (error) {
    next(error);
  }
};

/* ── DELETE  (DELETE /api/consultations/:id) — ADMIN ── */
exports.deleteRequest = async (req, res, next) => {
  try {
    const request = await ConsultationRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    await request.destroy();
    res.json({ success: true, message: "Request deleted" });
  } catch (error) {
    next(error);
  }
};