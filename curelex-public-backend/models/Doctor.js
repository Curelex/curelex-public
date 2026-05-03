const { DataTypes } = require("sequelize");
const sequelize = require("../config/mysql");

const Doctor = sequelize.define("Doctor", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  // ── Core account fields (set at registration) ──
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  // ── Step 1: Basic Info ──
  mobile: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  specialization: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  // ── Step 2: Professional Documents ──
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  aadhaar: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  licenseNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  photoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  photoPublicId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  certificateUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  certificatePublicId: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  // ── Step 3: Professional Experience ──
  experience: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  qualification: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  currentInstitute: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  // ── Step 4: Bank / Payment Details ──
  bankName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  accountHolderName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  accountNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ifscCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  // ── Step 4: UPI / QR Code ──  ✅ NEW
  qrCodeUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  qrCodePublicId: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  // ── Status & activity ──
  verificationStatus: {
    type: DataTypes.ENUM("pending", "approved", "rejected"),
    defaultValue: "pending",
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  profileComplete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
}, {
  timestamps: true,
});

module.exports = Doctor;