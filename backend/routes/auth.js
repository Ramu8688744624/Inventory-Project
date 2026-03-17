const express = require('express');
const controller = require('../controllers/authController');

const router = express.Router();
const { requireAdmin } = require('../middleware/authMiddleware');

router.get('/config', controller.config);
router.post('/register', controller.register);
router.post('/verify-email', controller.verifyEmail);
router.post('/login', controller.login);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);

router.get('/me', controller.me);
router.patch('/settings', controller.updateSettings);

module.exports = router;
