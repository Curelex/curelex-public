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
    defaultValue: false, // false = pending, true = approved
    allowNull: false,
  },
}, {
  timestamps: true,
});

// ✅ Associations — call this from your app.js / index.js after all models are loaded
Appointment.associate = (models) => {
  Appointment.belongsTo(models.User,   { foreignKey: "patientId", as: "patient" });
  Appointment.belongsTo(models.Doctor, { foreignKey: "doctorId",  as: "doctor"  });
};

module.exports = Appointment;