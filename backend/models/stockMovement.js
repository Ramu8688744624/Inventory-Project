const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'stock_movements',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      shop_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      item_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      movement_type: { type: DataTypes.ENUM('IN', 'OUT', 'ADJUST'), allowNull: false },
      quantity_delta: { type: DataTypes.INTEGER, allowNull: false },
      note: { type: DataTypes.STRING(255), allowNull: true },
    },
    { timestamps: true, updatedAt: false }
  );

