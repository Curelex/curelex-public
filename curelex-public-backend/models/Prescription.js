const { DataTypes } = require("sequelize");
const sequelize = require("../config/mysql");

const Prescription = sequelize.define("Prescription", {
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
  appointmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  medicines: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  notes: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.ENUM("pending", "dispensed"),
    defaultValue: "pending",
  },
}, {
  timestamps: true,
});

// ✅ Associations — called from app.js after all models load
Prescription.associate = (models) => {
  Prescription.belongsTo(models.Doctor,      { foreignKey: "doctorId",      as: "doctor"      });
  Prescription.belongsTo(models.Appointment, { foreignKey: "appointmentId", as: "appointment" });
};

module.exports = Prescription;