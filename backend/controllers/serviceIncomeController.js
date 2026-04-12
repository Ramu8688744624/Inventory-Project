const { wrap } = require('./wrap');
const { getShopId } = require('../services/shopContext');
const svc = require('../services/serviceIncomeService');

const create = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const data = await svc.createServiceIncome(shopId, req.body, req.userId);
  res.status(201).json({ data });
});

const list = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const data = await svc.listServiceIncome(shopId, {
    filter: req.query.filter,
    from: req.query.from,
    to: req.query.to,
    limit: req.query.limit,
  });
  res.json({ data });
});

const remove = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const id = Number(req.params.id);
  const data = await svc.deleteServiceIncome(shopId, id, req.userId);
  res.json({ data });
});

const update = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const id = Number(req.params.id);
  const data = await svc.updateServiceIncome(shopId, id, req.body, req.userId);
  res.json({ data });
});

module.exports = { create, list, remove, update };

