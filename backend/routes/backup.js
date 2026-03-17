const express = require('express');
const controller = require('../controllers/backupController');
const { requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAdmin);
router.get('/export', controller.exportBackup);
router.post('/import', controller.importBackup);
router.get('/export-history', controller.exportHistory);
router.post('/restore-history', controller.restoreHistory);

module.exports = router;
