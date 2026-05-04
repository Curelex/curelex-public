const express = require("express");
const router  = express.Router();

const {
  createRequest,
  getAllRequests,
  updateRequest,
  deleteRequest,
} = require("../controllers/consultationController");

const auth          = require("../middleware/auth");
const { adminAuth } = require("../middleware/role.middleware");

// PUBLIC
router.post("/", createRequest);

// ADMIN only
router.get("/",       auth, adminAuth, getAllRequests);
router.patch("/:id",  auth, adminAuth, updateRequest);
router.delete("/:id", auth, adminAuth, deleteRequest);

module.exports = router;