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
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const { rows, count } = await reports.stockList(shopId, {
    categoryId: req.query.categoryId,
    page,
    pageSize,
  });
  res.json({ data: rows, meta: { count, page, pageSize } });
});

const outOfStock = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const { rows, count } = await reports.outOfStock(shopId, { page, pageSize });
  res.json({ data: rows, meta: { count, page, pageSize } });
});

const lowStock = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const { rows, count } = await reports.lowStock(shopId, { page, pageSize });
  res.json({ data: rows, meta: { count, page, pageSize } });
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

