const { Category, Item } = require('../models');
const { AppError } = require('./errors');

async function listCategories(shopId) {
  return Category.findAll({
    where: { shop_id: shopId },
    order: [['name', 'ASC']],
  });
}

async function createCategory(shopId, { name }) {
  const trimmed = String(name || '').trim();
  if (!trimmed) throw new AppError('Category name is required.', 400);
  return Category.create({ shop_id: shopId, name: trimmed });
}

async function updateCategory(shopId, id, { name, is_active }) {
  const cat = await Category.findOne({ where: { id, shop_id: shopId } });
  if (!cat) throw new AppError('Category not found.', 404);

  if (name !== undefined) {
    const trimmed = String(name || '').trim();
    if (!trimmed) throw new AppError('Category name is required.', 400);
    cat.name = trimmed;
  }
  if (is_active !== undefined) cat.is_active = Boolean(is_active);
  await cat.save();
  return cat;
}

async function deleteCategory(shopId, id) {
  const cat = await Category.findOne({ where: { id, shop_id: shopId } });
  if (!cat) throw new AppError('Category not found.', 404);

  const count = await Item.count({ where: { shop_id: shopId, category_id: id } });
  if (count > 0) throw new AppError('Cannot delete category: items exist in this category.', 409);

  await cat.destroy();
  return { ok: true };
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};

