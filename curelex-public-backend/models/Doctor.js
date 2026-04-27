const { DataTypes } = require("sequelize");
const sequelize = require("../config/mysql");

const Doctor = sequelize.define("Doctor", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  mobile: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true
  },
  regNum: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true
  },
  regState: {
    type: DataTypes.STRING,
    allowNull: true
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true,

  },
  gender: {
    type: DataTypes.ENUM("male", "female", "other"),
    allowNull: true,

  },
  patientsHandeled: {
    type: DataTypes.INTEGER,
    allowNull: true,

  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  specialization: {
    type: DataTypes.STRING,
    allowNull: true
  },
  experience: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  certificateUrl: {
    type: DataTypes.STRING
  },
  certificatePublicId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  photoUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  photoPublicId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  verificationStatus: {
    type: DataTypes.ENUM("pending", "approved", "rejected"),
    defaultValue: "pending"
  }
}, {
  timestamps: true
});

module.exports = Doctor;