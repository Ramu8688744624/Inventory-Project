const { wrap } = require('./wrap');
const { getShopId } = require('../services/shopContext');
const categoryService = require('../services/categoryService');

const list = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const data = await categoryService.listCategories(shopId);
  res.json({ data });
});

const create = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const data = await categoryService.createCategory(shopId, req.body, req.userId);
  res.status(201).json({ data });
});

const update = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const id = Number(req.params.id);
  const data = await categoryService.updateCategory(shopId, id, req.body, req.userId);
  res.json({ data });
});

const remove = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const id = Number(req.params.id);
  const data = await categoryService.deleteCategory(shopId, id, req.userId);
  res.json({ data });
});

module.exports = { list, create, update, remove };

