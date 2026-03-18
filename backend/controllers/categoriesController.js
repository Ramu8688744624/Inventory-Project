const { wrap } = require('./wrap');
const { getShopId } = require('../services/shopContext');
const categoryService = require('../services/categoryService');

const list = wrap(async (req, res) => {
  const shopId = getShopId(req);
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const { rows, count } = await categoryService.listCategories(shopId, { page, pageSize });
  res.json({ data: rows, meta: { count, page, pageSize } });
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

