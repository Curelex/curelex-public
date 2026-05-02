const { DataTypes } = require("sequelize");
const sequelize = require("../config/mysql");

const Appointment = sequelize.define("Appointment", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  patientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  doctorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  // ✅ Store patient name at booking time so it's always available
  patientName: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  symptoms: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  appointmentTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },

  meetingLink: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  status: {
    type: DataTypes.ENUM("scheduled", "completed", "cancelled"),
    defaultValue: "scheduled",
  },

  doctorApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },

  // ✅ Doctor saves these when completing a consultation
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  doctorNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // Stored as JSON array: [{ name: 'CBC', type: 'Pathology' }, ...]
  tests: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  followUpDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },

  followUpInstructions: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

}, {
  timestamps: true,
});

// ✅ Associations — called from app.js after all models are loaded
Appointment.associate = (models) => {
  Appointment.belongsTo(models.User,   { foreignKey: "patientId", as: "patient" });
  Appointment.belongsTo(models.Doctor, { foreignKey: "doctorId",  as: "doctor"  });
};

module.exports = Appointment;