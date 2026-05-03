const multer                = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary            = require("../config/cloudinary");

// ── Registration uploader (photo + certificate) ──────────────────
const registrationStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    if (file.fieldname === "photo") {
      return {
        folder:          "curelex_profile_photos",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        resource_type:   "image",
        transformation:  [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
      };
    }
    const isPdf = file.mimetype === "application/pdf";
    return {
      folder:          "curelex_certificates",
      allowed_formats: ["jpg", "jpeg", "png", "pdf"],
      resource_type:   isPdf ? "raw" : "image",
      format:          isPdf ? "pdf"  : undefined,
    };
  },
});

function fileFilter(req, file, cb) {
  const allowed = [
    "image/jpeg", "image/jpg", "image/png",
    "image/webp", "application/pdf",
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname), false);
  }
}

// Used on /register
const uploadRegistration = multer({
  storage:    registrationStorage,
  fileFilter: fileFilter,
  limits:     { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).fields([
  { name: "certificate", maxCount: 1 },
  { name: "photo",       maxCount: 1 },
]);

// ── Profile photo uploader  (PUT /:id/photo) ─────────────────────
const uploadProfilePhoto = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder:          "curelex_profile_photos",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      resource_type:   "image",
      transformation:  [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Only image files allowed"), false);
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
}).single("photo");

// ── QR code uploader  (PUT /:id/qr)  ✅ NEW ──────────────────────
const uploadQrCode = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder:          "curelex_qr_codes",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      resource_type:   "image",
      // No crop transformation — keep the full QR intact
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Only image files allowed for QR code"), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single("qrCode");

// ── Error handler (must be 4-arg for Express) ────────────────────
function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE:       "File too large. Max 5MB for certificates, 2MB for photos.",
      LIMIT_UNEXPECTED_FILE: `Unexpected field "${err.field}". Use "certificate" or "photo".`,
    };
    return res.status(400).json({ message: messages[err.code] || err.message });
  }
  if (err) return res.status(400).json({ message: err.message });
  next();
}

module.exports = { uploadRegistration, uploadProfilePhoto, uploadQrCode, handleUploadError };