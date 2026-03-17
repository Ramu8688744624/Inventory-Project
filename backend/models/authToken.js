const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'auth_tokens',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      token: { type: DataTypes.STRING(64), allowNull: false },
      token_type: { type: DataTypes.ENUM('verify', 'reset'), allowNull: false },
      expires_at: { type: DataTypes.DATE, allowNull: false },
    },
    {
      timestamps: true,
      updatedAt: false,
      indexes: [{ unique: true, fields: ['token'] }, { fields: ['user_id'] }],
    }
  );
