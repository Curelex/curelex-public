const express = require("express");
const router  = express.Router();

const {
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
  updateConsultationFee,  // ✅ NEW
} = require("../controllers/adminController");

const auth            = require("../middleware/auth");
const { adminAuth }   = require("../middleware/role.middleware");

router.get("/pending-doctors",  auth, adminAuth, getPendingDoctors);
router.post("/approve/:id",     auth, adminAuth, approveDoctor);
router.post("/reject/:id",      auth, adminAuth, rejectDoctor);
router.patch("/fee/:id",        auth, adminAuth, updateConsultationFee);  // ✅ NEW

module.exports = router;