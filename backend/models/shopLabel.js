const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'shop_labels',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      shop_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      label_key: { type: DataTypes.STRING(64), allowNull: false },
      label_value: { type: DataTypes.STRING(255), allowNull: false },
    },
    { timestamps: true }
  );

