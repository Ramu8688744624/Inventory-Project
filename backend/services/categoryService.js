const { Op } = require('sequelize');
const { Category, Item, CategoryHistory } = require('../models');
const { AppError } = require('./errors');

async function listCategories(shopId) {
  return Category.findAll({
    where: { shop_id: shopId },
    order: [['name', 'ASC']],
  });
}

async function createCategory(shopId, { name }, userId = null) {
  const trimmed = String(name || '').trim();
  if (!trimmed) throw new AppError('Category name is required.', 400);
  const existing = await Category.findOne({ where: { shop_id: shopId, name: trimmed } });
  if (existing) throw new AppError('Category already exists in this shop.', 409);
  const created = await Category.create({ shop_id: shopId, name: trimmed });
  await CategoryHistory.create({
    original_id: created.id,
    shop_id: shopId,
    user_id: userId,
    operation_type: 'INSERT',
    data_snapshot: JSON.stringify({
      id: created.id,
      shop_id: shopId,
      name: created.name,
      is_active: created.is_active,
    }),
    created_at: new Date(),
  });
  return created;
}

async function updateCategory(shopId, id, { name, is_active }, userId = null) {
  const cat = await Category.findOne({ where: { id, shop_id: shopId } });
  if (!cat) throw new AppError('Category not found.', 404);

  if (name !== undefined) {
    const trimmed = String(name || '').trim();
    if (!trimmed) throw new AppError('Category name is required.', 400);
    const existing = await Category.findOne({
      where: {
        shop_id: shopId,
        name: trimmed,
        id: { [Op.ne]: cat.id },
      },
    });
    if (existing) throw new AppError('Category already exists in this shop.', 409);
    cat.name = trimmed;
  }
  if (is_active !== undefined) cat.is_active = Boolean(is_active);
  await cat.save();

  await CategoryHistory.create({
    original_id: cat.id,
    shop_id: shopId,
    user_id: userId,
    operation_type: 'UPDATE',
    data_snapshot: JSON.stringify({
      id: cat.id,
      shop_id: shopId,
      name: cat.name,
      is_active: cat.is_active,
    }),
    created_at: new Date(),
  });

  return cat;
}

async function deleteCategory(shopId, id, userId = null) {
  const cat = await Category.findOne({ where: { id, shop_id: shopId } });
  if (!cat) throw new AppError('Category not found.', 404);

  const count = await Item.count({ where: { shop_id: shopId, category_id: id } });
  if (count > 0) throw new AppError('Cannot delete category: items exist in this category.', 409);

  await CategoryHistory.create({
    original_id: cat.id,
    shop_id: shopId,
    user_id: userId,
    operation_type: 'DELETE',
    data_snapshot: JSON.stringify({
      id: cat.id,
      shop_id: shopId,
      name: cat.name,
      is_active: cat.is_active,
    }),
    created_at: new Date(),
  });

  await cat.destroy();
  return { ok: true };
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};

