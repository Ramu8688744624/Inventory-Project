const { wrap } = require('./wrap');
const { getShopId } = require('../services/shopContext');
const salesService = require('../services/salesService');

const create = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const data = await salesService.createSale(shopId, req.body);
  res.status(201).json({ data });
});

const list = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const data = await salesService.listSales(shopId, {
    filter: req.query.filter,
    from: req.query.from,
    to: req.query.to,
    limit: req.query.limit,
  });
  res.json({ data });
});

const itemHistory = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const itemId = Number(req.params.itemId);
  const data = await salesService.itemSalesHistory(shopId, itemId, { limit: req.query.limit });
  res.json({ data });
});

module.exports = { create, list, itemHistory };

