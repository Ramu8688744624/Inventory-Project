const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'categories',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      shop_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      name: { type: DataTypes.STRING(80), allowNull: false },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      timestamps: true,
      indexes: [{ unique: true, fields: ['shop_id', 'name'] }],
    }
  );

