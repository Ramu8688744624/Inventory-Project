const authService = require('../services/authService');
const { User } = require('../models');

async function requireAuth(req, res, next) {
  if (process.env.AUTH_ENABLED !== '1') return next();

  const openPaths = [
    '/api/auth/login',
    '/api/auth/verify-email',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/config',
  ];

  if (req.path === '/api/auth/register') {
    const bearer = req.header('Authorization');
    const decoded = authService.verifyToken(bearer);

    if (decoded) {
      req.shopId = decoded.shopId;
      req.userId = decoded.userId;
      req.userRole = decoded.role || 'user';
      return next();
    }

    const usersCount = await User.count();
    if (usersCount === 0) {
      return next();
    }

    return res.status(403).json({ error: 'Registration is disabled. Contact your administrator.' })
  }

  if (openPaths.includes(req.path)) {
    return next();
  }

  const bearer = req.header('Authorization');
  const decoded = authService.verifyToken(bearer);
  if (!decoded) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  req.shopId = decoded.shopId;
  req.userId = decoded.userId;
  req.userRole = decoded.role || 'user';

  if (req.userRole !== 'admin' && req.method !== 'GET' && req.path.startsWith('/api/admin')) {
    return res.status(403).json({ error: 'Admin privileges required.' });
  }

  next();
}

function requireAdmin(req, res, next) {
  if (process.env.AUTH_ENABLED !== '1') return next();
  if (req.userRole === 'admin') return next();
  return res.status(403).json({ error: 'Admin privileges required.' });
}

module.exports = { requireAuth, requireAdmin };
