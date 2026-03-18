const express = require('express');
const controller = require('../controllers/adminController');

const router = express.Router();

router.get('/users', controller.listUsers);
router.post('/users', controller.createUser);
router.patch('/reset-password', controller.resetPassword);
router.patch('/toggle-user-status', controller.toggleUserStatus);
router.post('/reset-system', controller.resetSystem);

module.exports = router;
