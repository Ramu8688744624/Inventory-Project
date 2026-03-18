const { Op, fn, col, literal } = require('sequelize');
const { sequelize, Shop, Item, Category, Sale, SaleItem, ServiceIncome } = require('../models');
const { AppError } = require('./errors');
const { rangeForFilter } = require('./salesService');

async function getShopSettings(shopId) {
  const shop = await Shop.findByPk(shopId);
  if (!shop) throw new AppError('Shop not found.', 404);
  return shop;
}

async function dashboard(shopId) {
  const shop = await getShopSettings(shopId);
  const lowThreshold = Number(shop.low_stock_threshold) || 2;

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const startWeek = (() => {
    const day = now.getDay();
    const diffToMon = (day + 6) % 7;
    const d = new Date(now);
    d.setDate(now.getDate() - diffToMon);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  })();

  const [salesToday, salesWeek, salesMonth] = await Promise.all([
    Sale.sum('total_amount', { where: { shop_id: shopId, sold_at: { [Op.between]: [startToday, endToday] } } }),
    Sale.sum('total_amount', { where: { shop_id: shopId, sold_at: { [Op.between]: [startWeek, endToday] } } }),
    Sale.sum('total_amount', { where: { shop_id: shopId, sold_at: { [Op.between]: [startMonth, endToday] } } }),
  ]);

  const [profitToday, profitMonth] = await Promise.all([
    Sale.sum('total_profit', { where: { shop_id: shopId, sold_at: { [Op.between]: [startToday, endToday] } } }),
    Sale.sum('total_profit', { where: { shop_id: shopId, sold_at: { [Op.between]: [startMonth, endToday] } } }),
  ]);

  const [stockValueRow] = await sequelize.query(
    `
    SELECT COALESCE(SUM(i.quantity * i.cost_price), 0) AS stock_value
    FROM items i
    WHERE i.shop_id = :shopId AND i.is_active = TRUE
    `,
    { replacements: { shopId }, type: sequelize.QueryTypes.SELECT }
  );

  const [lowStock, outOfStock] = await Promise.all([
    Item.findAll({
      where: { shop_id: shopId, is_active: true, quantity: { [Op.gt]: 0, [Op.lte]: lowThreshold } },
      include: [{ model: Category, attributes: ['id', 'name'] }],
      order: [['quantity', 'ASC'], ['item_name', 'ASC']],
      limit: 20,
    }),
    Item.findAll({
      where: { shop_id: shopId, is_active: true, quantity: 0 },
      include: [{ model: Category, attributes: ['id', 'name'] }],
      order: [['item_name', 'ASC']],
      limit: 50,
    }),
  ]);

  return {
    sales_today: Number(salesToday || 0),
    sales_week: Number(salesWeek || 0),
    sales_month: Number(salesMonth || 0),
    profit_today: Number(profitToday || 0),
    profit_month: Number(profitMonth || 0),
    stock_value: Number(stockValueRow?.stock_value || 0),
    low_stock_threshold: lowThreshold,
    low_stock_items: lowStock,
    out_of_stock_items: outOfStock,
  };
}

async function stockList(shopId, { categoryId, page = 1, pageSize = 10 } = {}) {
  const where = { shop_id: shopId, is_active: true };
  if (categoryId) where.category_id = Number(categoryId);

  const limit = Math.min(100, Math.max(1, Number(pageSize) || 10));
  const offset = (Math.max(1, Number(page) || 1) - 1) * limit;

  const { rows, count } = await Item.findAndCountAll({
    where,
    include: [{ model: Category, attributes: ['id', 'name'] }],
    order: [['item_name', 'ASC'], ['model', 'ASC']],
    limit,
    offset,
  });

  const payload = rows.map((i) => {
    const qty = Number(i.quantity);
    const cp = Number(i.cost_price);
    const sp = Number(i.selling_price);
    return {
      id: i.id,
      item_name: i.item_name,
      model: i.model,
      category: i.category ? { id: i.category.id, name: i.category.name } : null,
      quantity: qty,
      cost_price: cp,
      selling_price: sp,
      total_stock_value: qty * cp,
    };
  });

  return { rows: payload, count };
}

async function outOfStock(shopId, { page = 1, pageSize = 10 } = {}) {
  const limit = Math.min(100, Math.max(1, Number(pageSize) || 10));
  const offset = (Math.max(1, Number(page) || 1) - 1) * limit;
  const { rows, count } = await Item.findAndCountAll({
    where: { shop_id: shopId, is_active: true, quantity: 0 },
    include: [{ model: Category, attributes: ['id', 'name'] }],
    order: [['item_name', 'ASC'], ['model', 'ASC']],
    limit,
    offset,
  });
  return { rows, count };
}

async function lowStock(shopId, { page = 1, pageSize = 10 } = {}) {
  const shop = await getShopSettings(shopId);
  const lowThreshold = Number(shop.low_stock_threshold) || 2;
  const limit = Math.min(100, Math.max(1, Number(pageSize) || 10));
  const offset = (Math.max(1, Number(page) || 1) - 1) * limit;
  const { rows, count } = await Item.findAndCountAll({
    where: { shop_id: shopId, is_active: true, quantity: { [Op.gt]: 0, [Op.lte]: lowThreshold } },
    include: [{ model: Category, attributes: ['id', 'name'] }],
    order: [['quantity', 'ASC'], ['item_name', 'ASC'], ['model', 'ASC']],
    limit,
    offset,
  });
  return { rows, count };
}

async function profitSummary(shopId, { filter, from, to } = {}) {
  const range = rangeForFilter(filter, { from, to });
  const saleWhere = { shop_id: shopId };
  if (range.from && range.to) saleWhere.sold_at = { [Op.between]: [range.from, range.to] };

  const serviceWhere = { shop_id: shopId };
  if (range.from && range.to) {
    const f = range.from.toISOString().slice(0, 10);
    const t = range.to.toISOString().slice(0, 10);
    serviceWhere.service_date = { [Op.between]: [f, t] };
  }

  const [salesProfit, serviceProfit] = await Promise.all([
    Sale.sum('total_profit', { where: saleWhere }),
    ServiceIncome.sum('amount', { where: serviceWhere }),
  ]);

  return {
    sales_profit: Number(salesProfit || 0),
    service_profit: Number(serviceProfit || 0),
    total_profit: Number(salesProfit || 0) + Number(serviceProfit || 0),
    range: range.from && range.to ? { from: range.from, to: range.to } : null,
  };
}

async function profitByCategory(shopId, { filter, from, to } = {}) {
  const range = rangeForFilter(filter, { from, to });
  const where = { shop_id: shopId };
  if (range.from && range.to) {
    where.created_at = { [Op.between]: [range.from, range.to] };
  }

  const rows = await SaleItem.findAll({
    where,
    attributes: [
      'category_id',
      'category_name_snapshot',
      [fn('SUM', col('line_profit')), 'profit'],
      [fn('SUM', col('line_total')), 'sales'],
      [fn('SUM', col('quantity')), 'qty'],
    ],
    group: ['category_id', 'category_name_snapshot'],
    order: [[literal('profit'), 'DESC']],
  });

  return rows.map((r) => ({
    category_id: Number(r.category_id),
    category_name: r.category_name_snapshot,
    profit: Number(r.get('profit') || 0),
    sales: Number(r.get('sales') || 0),
    quantity: Number(r.get('qty') || 0),
  }));
}

async function profitByItem(shopId, { filter, from, to, limit = 200 } = {}) {
  const range = rangeForFilter(filter, { from, to });
  const where = { shop_id: shopId };
  if (range.from && range.to) {
    where.created_at = { [Op.between]: [range.from, range.to] };
  }

  const rows = await SaleItem.findAll({
    where,
    attributes: [
      'item_id',
      'item_name_snapshot',
      'model_snapshot',
      [fn('SUM', col('line_profit')), 'profit'],
      [fn('SUM', col('line_total')), 'sales'],
      [fn('SUM', col('quantity')), 'qty'],
    ],
    group: ['item_id', 'item_name_snapshot', 'model_snapshot'],
    order: [[literal('profit'), 'DESC']],
    limit: Math.min(Number(limit) || 200, 1000),
  });

  return rows.map((r) => ({
    item_id: Number(r.item_id),
    item_name: r.item_name_snapshot,
    model: r.model_snapshot,
    profit: Number(r.get('profit') || 0),
    sales: Number(r.get('sales') || 0),
    quantity: Number(r.get('qty') || 0),
  }));
}

module.exports = {
  dashboard,
  stockList,
  outOfStock,
  lowStock,
  profitSummary,
  profitByCategory,
  profitByItem,
};

