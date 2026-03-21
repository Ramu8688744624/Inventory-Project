const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'items',
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      shop_id: { type: DataTypes.BIGINT, allowNull: false },
      category_id: { type: DataTypes.BIGINT, allowNull: false },
      item_name: { type: DataTypes.STRING(120), allowNull: false },
      model: { type: DataTypes.STRING(120), allowNull: false },
      cost_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      selling_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      timestamps: true,
      indexes: [
        { unique: true, fields: ['shop_id', 'category_id', 'item_name', 'model'] },
        { fields: ['shop_id', 'item_name'] },
        { fields: ['shop_id', 'model'] },
        { fields: ['category_id'] },
      ],
    }
  );

