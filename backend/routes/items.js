const express = require('express');
const controller = require('../controllers/itemsController');

const router = express.Router();

router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.post('/:id/add-stock', controller.addStock);
router.delete('/:id', controller.remove);

module.exports = router;

