const { wrap } = require('./wrap');
const { getShopId } = require('../services/shopContext');
const reports = require('../services/reportsService');

const dashboard = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const data = await reports.dashboard(shopId);
  res.json({ data });
});

const stock = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const data = await reports.stockList(shopId, { categoryId: req.query.categoryId });
  res.json({ data });
});

const outOfStock = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const data = await reports.outOfStock(shopId);
  res.json({ data });
});

const lowStock = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const data = await reports.lowStock(shopId);
  res.json({ data });
});

const profitSummary = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const data = await reports.profitSummary(shopId, {
    filter: req.query.filter,
    from: req.query.from,
    to: req.query.to,
  });
  res.json({ data });
});

const profitByCategory = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const data = await reports.profitByCategory(shopId, {
    filter: req.query.filter,
    from: req.query.from,
    to: req.query.to,
  });
  res.json({ data });
});

const profitByItem = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const data = await reports.profitByItem(shopId, {
    filter: req.query.filter,
    from: req.query.from,
    to: req.query.to,
    limit: req.query.limit,
  });
  res.json({ data });
});

module.exports = {
  dashboard,
  stock,
  outOfStock,
  lowStock,
  profitSummary,
  profitByCategory,
  profitByItem,
};

