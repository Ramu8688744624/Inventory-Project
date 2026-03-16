const express = require('express');
const controller = require('../controllers/reportsController');

const router = express.Router();

router.get('/dashboard', controller.dashboard);
router.get('/stock', controller.stock);
router.get('/out-of-stock', controller.outOfStock);
router.get('/low-stock', controller.lowStock);
router.get('/profit/summary', controller.profitSummary);
router.get('/profit/by-category', controller.profitByCategory);
router.get('/profit/by-item', controller.profitByItem);

module.exports = router;

