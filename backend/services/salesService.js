const { Op } = require('sequelize');
const { sequelize, Sale, SaleItem, Item, Category, StockMovement, SaleHistory } = require('../models');
const { AppError } = require('./errors');

async function createSale(shopId, payload, userId = null) {
  const soldAt = payload.sold_at ? new Date(payload.sold_at) : new Date();
  if (Number.isNaN(soldAt.getTime())) throw new AppError('Invalid sold_at.', 400);
  const lines = Array.isArray(payload.items) ? payload.items : [];
  if (lines.length === 0) throw new AppError('Sale items are required.', 400);

  return sequelize.transaction(async (t) => {
    const sale = await Sale.create(
      { shop_id: shopId, sold_at: soldAt, total_amount: 0, total_profit: 0 },
      { transaction: t }
    );

    let totalAmount = 0;
    let totalProfit = 0;

    for (const line of lines) {
      const itemId = Number(line.item_id);
      const quantity = Number(line.quantity);
      const sellingPriceEach = line.selling_price_each === undefined ? undefined : Number(line.selling_price_each);

      if (!itemId) throw new AppError('item_id is required.', 400);
      if (!Number.isFinite(quantity) || quantity <= 0) throw new AppError('quantity must be > 0.', 400);

      const item = await Item.findOne({
        where: { id: itemId, shop_id: shopId },
        include: [{ model: Category, attributes: ['id', 'name'] }],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!item) throw new AppError(`Item not found: ${itemId}`, 404);
      if (item.quantity < quantity) throw new AppError(`Insufficient stock for ${item.item_name} ${item.model}.`, 409);

      const spEach = Number.isFinite(sellingPriceEach) ? sellingPriceEach : Number(item.selling_price);
      const cpEach = Number(item.cost_price);
      const profitEach = spEach - cpEach;
      const lineTotal = spEach * quantity;
      const lineProfit = profitEach * quantity;

      await SaleItem.create(
        {
          sale_id: sale.id,
          shop_id: shopId,
          item_id: item.id,
          category_id: item.category_id,
          item_name_snapshot: item.item_name,
          model_snapshot: item.model,
          category_name_snapshot: item.category ? item.category.name : '',
          quantity,
          cost_price_at_sale: cpEach,
          selling_price_each: spEach,
          profit_each: profitEach,
          line_total: lineTotal,
          line_profit: lineProfit,
        },
        { transaction: t }
      );

      item.quantity -= quantity;
      await item.save({ transaction: t });
      await StockMovement.create(
        { shop_id: shopId, item_id: item.id, movement_type: 'OUT', quantity_delta: -quantity, note: `Sale #${sale.id}` },
        { transaction: t }
      );

      totalAmount += lineTotal;
      totalProfit += lineProfit;
    }

    sale.total_amount = totalAmount;
    sale.total_profit = totalProfit;
    await sale.save({ transaction: t });

    await SaleHistory.create(
      {
        original_id: sale.id,
        shop_id: shopId,
        user_id: userId,
        operation_type: 'INSERT',
        data_snapshot: JSON.stringify({
          id: sale.id,
          shop_id: shopId,
          sold_at: sale.sold_at,
          total_amount: sale.total_amount,
          total_profit: sale.total_profit,
        }),
        created_at: new Date(),
      },
      { transaction: t }
    );

    return sale;
  });
}

function rangeForFilter(filter, { from, to } = {}) {
  const now = new Date();
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  if (filter === 'today') return { from: startOfDay(now), to: endOfDay(now) };
  if (filter === 'week') {
    const day = now.getDay(); // 0 Sun..6 Sat
    const diffToMon = (day + 6) % 7;
    const start = new Date(now);
    start.setDate(now.getDate() - diffToMon);
    return { from: startOfDay(start), to: endOfDay(now) };
  }
  if (filter === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: startOfDay(start), to: endOfDay(now) };
  }
  if (filter === 'custom') {
    const f = new Date(from);
    const t = new Date(to);
    if (Number.isNaN(f.getTime()) || Number.isNaN(t.getTime())) throw new AppError('Invalid custom date range.', 400);
    return { from: startOfDay(f), to: endOfDay(t) };
  }
  return { from: null, to: null };
}

async function listSales(shopId, { filter, from, to, limit = 200 } = {}) {
  const where = { shop_id: shopId };
  const range = rangeForFilter(filter, { from, to });
  if (range.from && range.to) where.sold_at = { [Op.between]: [range.from, range.to] };

  return Sale.findAll({
    where,
    include: [
      {
        model: SaleItem,
        attributes: [
          'id',
          'item_id',
          'category_id',
          'item_name_snapshot',
          'model_snapshot',
          'category_name_snapshot',
          'quantity',
          'selling_price_each',
          'line_total',
          'line_profit',
        ],
      },
    ],
    order: [['sold_at', 'DESC']],
    limit: Math.min(Number(limit) || 200, 1000),
  });
}

async function itemSalesHistory(shopId, itemId, { limit = 200 } = {}) {
  return SaleItem.findAll({
    where: { shop_id: shopId, item_id: itemId },
    include: [{ model: Sale, attributes: ['id', 'sold_at'] }],
    order: [['created_at', 'DESC']],
    limit: Math.min(Number(limit) || 200, 1000),
  });
}

module.exports = {
  createSale,
  listSales,
  itemSalesHistory,
  rangeForFilter,
};

