const { wrap } = require('./wrap');
const { getShopId } = require('../services/shopContext');
const itemService = require('../services/itemService');

const list = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const data = await itemService.listItems(shopId, {
    categoryId: req.query.categoryId,
    q: req.query.q,
    includeInactive: req.query.includeInactive === 'true',
  });
  res.json({ data });
});

const get = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const id = Number(req.params.id);
  const data = await itemService.getItem(shopId, id);
  res.json({ data });
});

const create = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const data = await itemService.createItem(shopId, req.body);
  res.status(201).json({ data });
});

const update = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const id = Number(req.params.id);
  const data = await itemService.updateItem(shopId, id, req.body);
  res.json({ data });
});

const addStock = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const id = Number(req.params.id);
  const data = await itemService.addStock(shopId, id, req.body);
  res.json({ data });
});

const remove = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const id = Number(req.params.id);
  const data = await itemService.deleteItem(shopId, id);
  res.json({ data });
});

module.exports = { list, get, create, update, addStock, remove };

