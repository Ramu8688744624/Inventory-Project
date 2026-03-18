const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'service_income',
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      shop_id: { type: DataTypes.BIGINT, allowNull: false },
      service_name: { type: DataTypes.STRING(120), allowNull: false },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      service_date: { type: DataTypes.DATEONLY, allowNull: false },
      notes: { type: DataTypes.STRING(255), allowNull: true },
    },
    { timestamps: true }
  );

