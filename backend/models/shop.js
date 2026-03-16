const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'shops',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      city: { type: DataTypes.STRING(80), allowNull: true },
      state: { type: DataTypes.STRING(80), allowNull: true },
      country: { type: DataTypes.STRING(80), allowNull: true },
      logo_url: { type: DataTypes.STRING(255), allowNull: true },
      currency_code: { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'INR' },
      low_stock_threshold: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
    },
    { timestamps: true }
  );

