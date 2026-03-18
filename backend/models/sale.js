const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'sales',
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      shop_id: { type: DataTypes.BIGINT, allowNull: false },
      sold_at: { type: DataTypes.DATE, allowNull: false },
      total_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      total_profit: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    },
    { timestamps: true }
  );

