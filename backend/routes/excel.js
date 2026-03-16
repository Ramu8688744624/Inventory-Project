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
router.get('/export/inventory', controller.exportInventory);

module.exports = router;

