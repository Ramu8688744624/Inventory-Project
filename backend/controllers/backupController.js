const { wrap } = require('./wrap');
const { getShopId } = require('../services/shopContext');
const backupService = require('../services/backupService');

const exportBackup = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const data = await backupService.exportBackup(shopId);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="inventory-backup.json"');
  res.send(JSON.stringify(data, null, 2));
});

const importBackup = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const data = req.body;
  const result = await backupService.importBackup(shopId, data);
  res.json({ data: result, message: 'Backup restored successfully.' });
});

const exportHistory = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const data = await backupService.exportHistory(shopId);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="inventory-history-backup.json"');
  res.send(JSON.stringify(data, null, 2));
});

const restoreHistory = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const data = req.body;
  const result = await backupService.restoreHistory(shopId, data);
  res.json({ data: result, message: 'History restored successfully.' });
});

module.exports = { exportBackup, importBackup, exportHistory, restoreHistory };

