const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { uploadRegistration, uploadProfilePhoto, handleUploadError }
  = require("../middleware/upload");
// const upload = require("../middleware/upload");
const {
  registerDoctor,
  getApprovedDoctors,
  getDoctorById,
  loginDoctor,
  updateProfilePhoto
} = require("../controllers/doctorController");
const auth = require("../middleware/auth");
const { doctorAuth } = require("../middleware/role.middleware");

router.post(
  "/register",
  // uploadRegistration,    
  // handleUploadError,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password min 6 chars"),
  ],
  registerDoctor
);

router.post("/login", loginDoctor);

router.get("/all", auth, getApprovedDoctors);
router.get("/:id", auth, getDoctorById);

router.put(
  "/:id/photo",
  auth,
  doctorAuth,
  uploadProfilePhoto,     
  handleUploadError,
  updateProfilePhoto
);

module.exports = router;