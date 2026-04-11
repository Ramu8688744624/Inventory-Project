const { wrap } = require('./wrap');
const { getShopId } = require('../services/shopContext');
const salesService = require('../services/salesService');

const create = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const data = await salesService.createSale(shopId, req.body, req.userId);
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

const deleteSale = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const saleId = Number(req.params.saleId);
  const result = await salesService.deleteSale(shopId, saleId, req.userId);
  res.json(result);
});

const getDeletedSalesHistory = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const result = await salesService.listDeletedSalesHistory(shopId, {
    limit: req.query.limit,
    offset: req.query.offset,
  });
  res.json(result);
});

const hardDeleteHistory = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const historyId = Number(req.params.historyId);
  const result = await salesService.hardDeleteSaleHistory(shopId, historyId);
  res.json(result);
});

module.exports = { create, list, itemHistory, deleteSale, getDeletedSalesHistory, hardDeleteHistory };

