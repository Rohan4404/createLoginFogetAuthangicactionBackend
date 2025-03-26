const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("loginUsers", {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'user', 
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
}, {
  timestamps: true,  // Optional: if you want automatic createdAt/updatedAt
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = User;
