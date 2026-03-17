const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const controller = require('../controllers/excelController');

const router = express.Router();

const uploadDir = path.join(process.cwd(), 'tmp_uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 15 * 1024 * 1024 },
});

router.post('/import/inventory', upload.single('file'), controller.importInventory);
router.post('/import/categories', upload.single('file'), controller.importCategories);
router.get('/export/inventory', controller.exportInventory);
router.get('/export/categories', controller.exportCategories);
router.get('/export/inventory-template', controller.exportInventoryTemplate);
router.get('/export/categories-template', controller.exportCategoriesTemplate);

module.exports = router;

