const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'users',
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      shop_id: { type: DataTypes.BIGINT, allowNull: false },
      email: { type: DataTypes.STRING(255), allowNull: false },
      password_hash: { type: DataTypes.STRING(255), allowNull: false },
      verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      role: { type: DataTypes.ENUM('admin', 'user'), allowNull: false, defaultValue: 'user' },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      settings: { type: DataTypes.JSON, allowNull: true },
    },
    {
      timestamps: true,
      indexes: [{ unique: true, fields: ['email'] }, { fields: ['shop_id'] }],
    }
  );
