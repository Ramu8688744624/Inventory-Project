const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'sale_items',
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      sale_id: { type: DataTypes.BIGINT, allowNull: false },
      shop_id: { type: DataTypes.BIGINT, allowNull: false },
      item_id: { type: DataTypes.BIGINT, allowNull: false },
      category_id: { type: DataTypes.BIGINT, allowNull: false },
      item_name_snapshot: { type: DataTypes.STRING(120), allowNull: false },
      model_snapshot: { type: DataTypes.STRING(120), allowNull: false },
      category_name_snapshot: { type: DataTypes.STRING(80), allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      cost_price_at_sale: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      selling_price_each: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      profit_each: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      line_total: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      line_profit: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    },
    { timestamps: true, updatedAt: false }
  );

