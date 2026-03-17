const { Op } = require('sequelize');
const { sequelize, Item, Category, StockMovement, SaleItem, ItemHistory } = require('../models');
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

async function createItem(shopId, payload, userId = null) {
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

  const existing = await Item.findOne({
    where: {
      shop_id: shopId,
      item_name,
      model,
    },
  });
  if (existing) throw new AppError('Item with same name and model already exists in this shop.', 409);

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

    await ItemHistory.create(
      {
        original_id: item.id,
        shop_id: shopId,
        user_id: userId,
        operation_type: 'INSERT',
        data_snapshot: JSON.stringify({
          id: item.id,
          shop_id: shopId,
          category_id: item.category_id,
          item_name: item.item_name,
          model: item.model,
          cost_price: item.cost_price,
          selling_price: item.selling_price,
          quantity: item.quantity,
          is_active: item.is_active,
        }),
        created_at: new Date(),
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

async function updateItem(shopId, id, payload, userId = null) {
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

  // Ensure unique item within shop by name+model
  if (item.item_name && item.model) {
    const existing = await Item.findOne({
      where: {
        shop_id: shopId,
        item_name: item.item_name,
        model: item.model,
        id: { [Op.ne]: item.id },
      },
    });
    if (existing) {
      throw new AppError('Item with same name and model already exists in this shop.', 409);
    }
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

  await ItemHistory.create({
    original_id: item.id,
    shop_id: shopId,
    user_id: userId,
    operation_type: 'UPDATE',
    data_snapshot: JSON.stringify({
      id: item.id,
      shop_id: shopId,
      category_id: item.category_id,
      item_name: item.item_name,
      model: item.model,
      cost_price: item.cost_price,
      selling_price: item.selling_price,
      quantity: item.quantity,
      is_active: item.is_active,
    }),
    created_at: new Date(),
  });

  return item;
}

async function addStock(shopId, id, { quantity, note }, userId = null) {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) throw new AppError('quantity must be > 0.', 400);

  return sequelize.transaction(async (t) => {
    const item = await Item.findOne({ where: { id, shop_id: shopId }, transaction: t, lock: t.LOCK.UPDATE });
    if (!item) throw new AppError('Item not found.', 404);
    item.quantity += qty;
    await item.save({ transaction: t });

    await ItemHistory.create(
      {
        original_id: item.id,
        shop_id: shopId,
        user_id: userId,
        operation_type: 'UPDATE',
        data_snapshot: JSON.stringify({
          id: item.id,
          shop_id: shopId,
          category_id: item.category_id,
          item_name: item.item_name,
          model: item.model,
          cost_price: item.cost_price,
          selling_price: item.selling_price,
          quantity: item.quantity,
          is_active: item.is_active,
        }),
        created_at: new Date(),
      },
      { transaction: t }
    );

    await StockMovement.create(
      { shop_id: shopId, item_id: id, movement_type: 'IN', quantity_delta: qty, note: note ? String(note) : null },
      { transaction: t }
    );
    return item;
  });
}

async function deleteItem(shopId, id, userId = null) {
  const item = await Item.findOne({ where: { id, shop_id: shopId } });
  if (!item) throw new AppError('Item not found.', 404);

  const salesCount = await SaleItem.count({ where: { shop_id: shopId, item_id: id } });
  if (salesCount > 0) throw new AppError('Cannot delete item: sales history exists. Deactivate instead.', 409);

  await ItemHistory.create({
    original_id: item.id,
    shop_id: shopId,
    user_id: userId,
    operation_type: 'DELETE',
    data_snapshot: JSON.stringify({
      id: item.id,
      shop_id: shopId,
      category_id: item.category_id,
      item_name: item.item_name,
      model: item.model,
      cost_price: item.cost_price,
      selling_price: item.selling_price,
      quantity: item.quantity,
      is_active: item.is_active,
    }),
    created_at: new Date(),
  });

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

