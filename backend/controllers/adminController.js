const { wrap } = require('./wrap');
const adminService = require('../services/adminService');

const listUsers = wrap(async (req, res) => {
  const data = await adminService.listUsers();
  res.json({ data });
});
const createUser = wrap(async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required.' });
  const creator = { shop_id: req.userShopId || req.shopId || null, role: req.userRole };
  const data = await adminService.createUser({ email, password, role, shopId: creator.shop_id }, creator);
  res.status(201).json({ data });
});
const resetPassword = wrap(async (req, res) => {
  const { userId, newPassword } = req.body;
  if (!userId || !newPassword) return res.status(400).json({ error: 'userId and newPassword are required.' });
  const data = await adminService.resetUserPassword(Number(userId), String(newPassword));
  res.json({ data });
});

const toggleUserStatus = wrap(async (req, res) => {
  const { userId, isActive } = req.body;
  if (!userId || typeof isActive !== 'boolean') return res.status(400).json({ error: 'userId and isActive are required.' });
  const data = await adminService.toggleUserStatus(Number(userId), isActive);
  res.json({ data });
});

const resetSystem = wrap(async (req, res) => {
  const data = await adminService.resetSystem();
  res.json({ data, message: 'System reset completed.' });
});

module.exports = { listUsers, createUser, resetPassword, toggleUserStatus, resetSystem };
