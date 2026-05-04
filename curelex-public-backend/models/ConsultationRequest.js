const { DataTypes } = require("sequelize");
const sequelize = require("../config/mysql"); // ✅ FIXED: was "../config/database"

const ConsultationRequest = sequelize.define(
  "ConsultationRequest",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phoneCode: {
      type: DataTypes.STRING,
      defaultValue: "+91",
    },
    mobile: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    service: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("new", "contacted", "resolved"),
      defaultValue: "new",
    },
    adminNote: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "consultation_requests",
    timestamps: true,
  }
);

module.exports = ConsultationRequest;