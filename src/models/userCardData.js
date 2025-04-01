const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UserCardData = sequelize.define(
  "UserCardData",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true, // Auto-increment the id
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    endPoint: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lat: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    lon: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    // Allow Sequelize to automatically manage createdAt and updatedAt
    timestamps: true, // Enable automatic handling of createdAt and updatedAt fields
  }
);

module.exports = UserCardData;
