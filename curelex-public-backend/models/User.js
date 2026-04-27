const { DataTypes } = require("sequelize");
const sequelize = require("../config/mysql");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },

  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  age: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  gender: {
    type: DataTypes.ENUM("male", "female", "other"),
    allowNull: true,
  },

  mobile: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  role: {
    type: DataTypes.STRING,
    defaultValue: "patient",
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  emergency: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  aadhaar: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      len: [12, 12],
      isNumeric: true
    }
  },

}, {
  timestamps: true,
});

module.exports = User;