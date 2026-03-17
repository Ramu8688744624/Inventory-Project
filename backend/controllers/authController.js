const { wrap } = require('./wrap');
const { getShopId } = require('../services/shopContext');
const { User } = require('../models');
const authService = require('../services/authService');

const register = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const { email, password, shopName, city, currencyCode } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

  const createdBy = req.userId ? { role: req.userRole || 'user' } : null;
  const result = await authService.register({ email, password, shopId, createdBy, shopName, city, currencyCode });
  res.status(201).json(result);
});

const verifyEmail = wrap(async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required.' });
  const result = await authService.verifyEmail(token);
  res.json(result);
});

const login = wrap(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
  const result = await authService.login({ email, password });
  res.json(result);
});

const forgotPassword = wrap(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required.' });
  const result = await authService.forgotPassword(email);
  res.json(result);
});

const resetPassword = wrap(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Token and newPassword required.' });
  const result = await authService.resetPassword({ token, newPassword });
  res.json(result);
});

const config = wrap(async (req, res) => {
  const authEnabled = process.env.AUTH_ENABLED === '1';
  const userCount = await User.count();
  const allowRegistration = !authEnabled || userCount === 0;
  res.json({ authEnabled, allowRegistration });
});

const me = wrap(async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'Authentication required.' });
  const user = await authService.getUserById(req.userId);
  res.json({ user: { id: user.id, email: user.email, shop_id: user.shop_id, role: user.role, settings: user.settings || {} } });
});

const updateSettings = wrap(async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'Authentication required.' });
  const settings = req.body;
  const user = await authService.setUserSettings(req.userId, settings);
  res.json({ user: { id: user.id, email: user.email, shop_id: user.shop_id, role: user.role, settings: user.settings || {} } });
});

module.exports = { register, verifyEmail, login, forgotPassword, resetPassword, config, me, updateSettings };
