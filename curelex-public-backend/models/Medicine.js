const { DataTypes } = require("sequelize");
const sequelize = require("../config/mysql");

const Medicine = sequelize.define("Medicine", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  composition: {
    type: DataTypes.STRING
  },
  dosageForm: {
    type: DataTypes.STRING
  },
  manufacturer: {
    type: DataTypes.STRING
  },
  // ✅ NEW: links medicine to a specific doctor
  doctorId: {
    type: DataTypes.INTEGER,
    allowNull: true  // null = global, number = doctor's own
  }
}, {
  timestamps: true
});

module.exports = Medicine;