const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'categories_history',
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      original_id: { type: DataTypes.BIGINT, allowNull: false },
      shop_id: { type: DataTypes.BIGINT, allowNull: false },
      user_id: { type: DataTypes.BIGINT, allowNull: true },
      operation_type: { type: DataTypes.ENUM('INSERT', 'UPDATE', 'DELETE'), allowNull: false },
      data_snapshot: { type: DataTypes.TEXT, allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      timestamps: false,
      indexes: [{ fields: ['original_id'] }, { fields: ['shop_id'] }],
    }
  );
