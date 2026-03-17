const express = require('express');
const controller = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAdmin);
router.get('/users', controller.listUsers);
router.post('/users', controller.createUser);
router.patch('/reset-password', controller.resetPassword);
router.patch('/toggle-user-status', controller.toggleUserStatus);
router.post('/reset-system', controller.resetSystem);

module.exports = router;
