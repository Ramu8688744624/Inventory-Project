const { sequelize, Shop, User, Category, Item, Sale, SaleItem, ServiceIncome, StockMovement } = require('../models');
const { AppError } = require('./errors');
const bcrypt = require('bcryptjs');

async function listUsers() {
  return User.findAll({
    include: [{ model: Shop, attributes: ['id', 'name', 'city', 'country', 'currency_code'] }],
    attributes: ['id', 'email', 'shop_id', 'role', 'is_active', 'verified', 'settings', 'created_at', 'updated_at'],
  });
}

async function resetUserPassword(userId, newPassword) {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('User not found.', 404);
  const hash = await bcrypt.hash(newPassword, 10);
  await user.update({ password_hash: hash });
  return { ok: true };
}

async function toggleUserStatus(userId, isActive) {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('User not found.', 404);
  await user.update({ is_active: Boolean(isActive) });
  return { ok: true };
}

async function createUser({ email, password, role = 'user', shopId }, createdByUser) {
  if (role !== 'admin' && role !== 'user') {
    throw new AppError('Invalid role. Must be admin or user.', 400);
  }

  const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (existing) throw new AppError('Email already registered.', 409);

  const hash = await bcrypt.hash(password, 10);
  const shop = await Shop.findByPk(shopId || createdByUser.shop_id);
  if (!shop) throw new AppError('Shop not found.', 404);

  const user = await User.create({
    shop_id: shop.id,
    email: email.toLowerCase().trim(),
    password_hash: hash,
    role,
    is_active: true,
    settings: {},
    verified: true,
  });

  return { id: user.id, email: user.email, role: user.role, shop_id: user.shop_id };
}

async function resetSystem() {
  return sequelize.transaction(async (t) => {
    await SaleItem.destroy({ where: {}, transaction: t });
    await StockMovement.destroy({ where: {}, transaction: t });
    await Sale.destroy({ where: {}, transaction: t });
    await ServiceIncome.destroy({ where: {}, transaction: t });
    await Item.destroy({ where: {}, transaction: t });
    await Category.destroy({ where: {}, transaction: t });

    const adminUsers = await User.findAll({ where: { role: 'admin' }, transaction: t });
    const adminShopIds = [...new Set(adminUsers.map((u) => u.shop_id))];

    await Shop.destroy({ where: { id: { [sequelize.Op.notIn]: adminShopIds } }, transaction: t });

    const preservedAdmins = adminUsers.map((u) => u.id);
    await User.destroy({ where: { id: { [sequelize.Op.notIn]: preservedAdmins } }, transaction: t });

    return { ok: true };
  });
}

module.exports = {
  listUsers,
  resetUserPassword,
  toggleUserStatus,
  resetSystem,
  createUser,
};
