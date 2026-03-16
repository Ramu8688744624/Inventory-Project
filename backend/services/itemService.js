const { Op } = require('sequelize');
const { sequelize, Item, Category, StockMovement, SaleItem } = require('../models');
const { AppError } = require('./errors');

async function listItems(shopId, { categoryId, q, includeInactive } = {}) {
  const where = { shop_id: shopId };
  if (categoryId) where.category_id = Number(categoryId);
  if (!includeInactive) where.is_active = true;
  if (q) {
    const term = String(q).trim();
    where[Op.or] = [
      { item_name: { [Op.like]: `%${term}%` } },
      { model: { [Op.like]: `%${term}%` } },
    ];
  }
  return Item.findAll({
    where,
    include: [{ model: Category, attributes: ['id', 'name'] }],
    order: [
      ['item_name', 'ASC'],
      ['model', 'ASC'],
    ],
  });
}

async function getItem(shopId, id) {
  const item = await Item.findOne({
    where: { id, shop_id: shopId },
    include: [{ model: Category, attributes: ['id', 'name'] }],
  });
  if (!item) throw new AppError('Item not found.', 404);
  return item;
}

async function createItem(shopId, payload) {
  const category_id = Number(payload.category_id);
  const item_name = String(payload.item_name || '').trim();
  const model = String(payload.model || '').trim();
  const cost_price = Number(payload.cost_price);
  const selling_price = Number(payload.selling_price);
  const quantity = payload.quantity === undefined ? 0 : Number(payload.quantity);

  if (!category_id) throw new AppError('category_id is required.', 400);
  if (!item_name) throw new AppError('item_name is required.', 400);
  if (!model) throw new AppError('model is required.', 400);
  if (!Number.isFinite(cost_price)) throw new AppError('cost_price is required.', 400);
  if (!Number.isFinite(selling_price)) throw new AppError('selling_price is required.', 400);
  if (!Number.isFinite(quantity) || quantity < 0) throw new AppError('quantity must be >= 0.', 400);

  const category = await Category.findOne({ where: { id: category_id, shop_id: shopId } });
  if (!category) throw new AppError('Category not found.', 404);

  return sequelize.transaction(async (t) => {
    const item = await Item.create(
      {
        shop_id: shopId,
        category_id,
        item_name,
        model,
        cost_price,
        selling_price,
        quantity,
      },
      { transaction: t }
    );

    if (quantity > 0) {
      await StockMovement.create(
        { shop_id: shopId, item_id: item.id, movement_type: 'IN', quantity_delta: quantity, note: 'Initial stock' },
        { transaction: t }
      );
    }
    return item;
  });
}

async function updateItem(shopId, id, payload) {
  const item = await Item.findOne({ where: { id, shop_id: shopId } });
  if (!item) throw new AppError('Item not found.', 404);

  if (payload.category_id !== undefined) {
    const category_id = Number(payload.category_id);
    const category = await Category.findOne({ where: { id: category_id, shop_id: shopId } });
    if (!category) throw new AppError('Category not found.', 404);
    item.category_id = category_id;
  }
  if (payload.item_name !== undefined) {
    const v = String(payload.item_name || '').trim();
    if (!v) throw new AppError('item_name is required.', 400);
    item.item_name = v;
  }
  if (payload.model !== undefined) {
    const v = String(payload.model || '').trim();
    if (!v) throw new AppError('model is required.', 400);
    item.model = v;
  }
  if (payload.cost_price !== undefined) {
    const v = Number(payload.cost_price);
    if (!Number.isFinite(v)) throw new AppError('cost_price must be a number.', 400);
    item.cost_price = v;
  }
  if (payload.selling_price !== undefined) {
    const v = Number(payload.selling_price);
    if (!Number.isFinite(v)) throw new AppError('selling_price must be a number.', 400);
    item.selling_price = v;
  }
  if (payload.quantity !== undefined) {
    const v = Number(payload.quantity);
    if (!Number.isFinite(v) || v < 0) throw new AppError('quantity must be >= 0.', 400);
    item.quantity = v;
  }
  if (payload.is_active !== undefined) item.is_active = Boolean(payload.is_active);

  await item.save();
  return item;
}

async function addStock(shopId, id, { quantity, note }) {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) throw new AppError('quantity must be > 0.', 400);

  return sequelize.transaction(async (t) => {
    const item = await Item.findOne({ where: { id, shop_id: shopId }, transaction: t, lock: t.LOCK.UPDATE });
    if (!item) throw new AppError('Item not found.', 404);
    item.quantity += qty;
    await item.save({ transaction: t });
    await StockMovement.create(
      { shop_id: shopId, item_id: id, movement_type: 'IN', quantity_delta: qty, note: note ? String(note) : null },
      { transaction: t }
    );
    return item;
  });
}

async function deleteItem(shopId, id) {
  const item = await Item.findOne({ where: { id, shop_id: shopId } });
  if (!item) throw new AppError('Item not found.', 404);

  const salesCount = await SaleItem.count({ where: { shop_id: shopId, item_id: id } });
  if (salesCount > 0) throw new AppError('Cannot delete item: sales history exists. Deactivate instead.', 409);

  await item.destroy();
  return { ok: true };
}

module.exports = {
  listItems,
  getItem,
  createItem,
  updateItem,
  addStock,
  deleteItem,
};

