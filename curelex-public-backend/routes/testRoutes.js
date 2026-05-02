const express = require("express");
const router  = express.Router();

const { getDoctorTests, addDoctorTest, deleteDoctorTest } = require("../controllers/testController");
const auth = require("../middleware/auth");
const { doctorAuth } = require("../middleware/role.middleware");

// Get tests for a specific doctor
router.get("/doctor/:doctorId", auth, getDoctorTests);

// Doctor adds their own test
router.post("/doctor/add", auth, doctorAuth, addDoctorTest);

// Doctor deletes their own test
router.delete("/doctor/:id", auth, doctorAuth, deleteDoctorTest);

module.exports = router;