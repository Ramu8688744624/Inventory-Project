const fs = require('fs');
const { wrap } = require('./wrap');
const { getShopId } = require('../services/shopContext');
const excelService = require('../services/excelService');

const importInventory = wrap(async (req, res) => {
  const shopId = getShopId(req);
  if (!req.file) return res.status(400).json({ error: 'Excel file is required (field name: file).' });
  const result = await excelService.importInventoryFromExcel(shopId, req.file.path);
  fs.unlink(req.file.path, () => {});
  res.json({ data: result });
});

const exportInventory = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const buf = await excelService.exportInventoryToExcel(shopId);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="inventory.xlsx"');
  res.send(Buffer.from(buf));
});

module.exports = { importInventory, exportInventory };

