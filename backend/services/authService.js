const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, AuthToken, Shop } = require('../models');
const { AppError } = require('./errors');
const { sendVerificationEmail, sendPasswordResetEmail } = require('./mailer');

const JWT_SECRET = process.env.JWT_SECRET || 'inventory-dev-secret-change-in-prod';
const JWT_EXPIRY = '7d';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

async function register({ email, password, shopId, createdBy, shopName, city, currencyCode }) {
  const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (existing) throw new AppError('Email already registered.', 409);

  const userCount = await User.count();

  let role = 'user';
  let verified = false;
  let shop = null;

  if (process.env.AUTH_ENABLED === '1') {
    if (userCount === 0) {
      if (!shopName || !currencyCode) {
        throw new AppError('Initial setup requires shopName and currencyCode.', 400);
      }
      shop = await Shop.create({ name: shopName, city: city || '', state: '', country: '', currency_code: currencyCode, low_stock_threshold: 2 });
      role = 'admin';
      verified = true;
    } else {
      if (!createdBy || createdBy.role !== 'admin') {
        throw new AppError('Admin privileges required to create new user.', 403);
      }
      if (!shopName || !currencyCode) {
        throw new AppError('New business setup requires shopName and currencyCode.', 400);
      }
      shop = await Shop.create({ name: shopName, city: city || '', state: '', country: '', currency_code: currencyCode, low_stock_threshold: 2 });
    }
  } else {
    // auth disabled version continues existing shop-based flow
    shop = await Shop.findByPk(shopId || 1);
    if (!shop) throw new AppError('Shop not found.', 404);
  }

  if (!shop) {
    shop = await Shop.findByPk(shopId || 1);
    if (!shop) throw new AppError('Shop not found.', 404);
  }

  // immediate verification policy: no email verification is required to log in
  verified = true;

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    shop_id: shop.id,
    email: email.toLowerCase().trim(),
    password_hash: hash,
    role,
    is_active: true,
    settings: {},
    verified,
  });

  if (!verified) {
    const token = crypto.randomBytes(32).toString('hex');
    await AuthToken.create({
      user_id: user.id,
      token,
      token_type: 'verify',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const verifyUrl = `${BASE_URL}/verify-email?token=${token}`;
    sendVerificationEmail(user.email, verifyUrl);
    return {
      message: 'Registration successful. Check email for verification link.',
      userId: user.id,
    };
  }

  return { message: 'Initial admin account created; login to continue.', userId: user.id };
}

async function verifyEmail(token) {
  const row = await AuthToken.findOne({
    where: { token, token_type: 'verify' },
    include: [User],
  });
  if (!row || new Date() > row.expires_at) throw new AppError('Invalid or expired verification link.', 400);

  await row.user.update({ verified: true });
  await row.destroy();

  const jwtToken = jwt.sign(
    { userId: row.user.id, shopId: row.user.shop_id, role: row.user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
  return {
    token: jwtToken,
    user: {
      id: row.user.id,
      email: row.user.email,
      shop_id: row.user.shop_id,
      role: row.user.role,
      settings: row.user.settings || {},
    },
  };
}

async function login({ email, password }) {
  const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (!user) throw new AppError('Invalid email or password.', 401);

  if (!user.is_active) throw new AppError('User account is disabled.', 403);

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new AppError('Invalid email or password.', 401);

  const token = jwt.sign(
    { userId: user.id, shopId: user.shop_id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      shop_id: user.shop_id,
      role: user.role,
      settings: user.settings || {},
    },
  };
}

async function forgotPassword(email) {
  const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (!user) return { message: 'If the email exists, a reset link will be sent.' };

  await AuthToken.destroy({ where: { user_id: user.id, token_type: 'reset' } });

  const token = crypto.randomBytes(32).toString('hex');
  await AuthToken.create({
    user_id: user.id,
    token,
    token_type: 'reset',
    expires_at: new Date(Date.now() + 60 * 60 * 1000),
  });

  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;
  sendPasswordResetEmail(user.email, resetUrl);

  return { message: 'If the email exists, a reset link will be sent.' };
}

async function resetPassword({ token, newPassword }) {
  const row = await AuthToken.findOne({
    where: { token, token_type: 'reset' },
    include: [User],
  });
  if (!row || new Date() > row.expires_at) throw new AppError('Invalid or expired reset link.', 400);

  const hash = await bcrypt.hash(newPassword, 10);
  await row.user.update({ password_hash: hash });
  await row.destroy();

  const jwtToken = jwt.sign(
    { userId: row.user.id, shopId: row.user.shop_id, role: row.user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
  return {
    token: jwtToken,
    user: {
      id: row.user.id,
      email: row.user.email,
      shop_id: row.user.shop_id,
      role: row.user.role,
      settings: row.user.settings || {},
    },
  };
}

function verifyToken(bearer) {
  if (!bearer || !bearer.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(bearer.slice(7), JWT_SECRET);
    return decoded;
  } catch {
    return null;
  }
}

async function getUserById(userId) {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('User not found.', 404);
  return user;
}

async function setUserSettings(userId, settings) {
  const user = await getUserById(userId);
  user.settings = { ...user.settings, ...settings };
  await user.save();
  return user;
}

module.exports = {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  verifyToken,
  getUserById,
  setUserSettings,
};
