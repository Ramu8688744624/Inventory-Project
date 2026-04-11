const express = require('express');
const controller = require('../controllers/salesController');

const router = express.Router();

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/item/:itemId/history', controller.itemHistory);
router.delete('/:saleId', controller.deleteSale);
router.get('/history/deleted/list', controller.getDeletedSalesHistory);
router.delete('/history/:historyId/hard-delete', controller.hardDeleteHistory);

module.exports = router;

