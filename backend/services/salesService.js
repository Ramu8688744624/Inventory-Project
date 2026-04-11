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
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!item) throw new AppError(`Item not found: ${itemId}`, 404);
      if (item.quantity < quantity) throw new AppError(`Insufficient stock for ${item.item_name} ${item.model}.`, 409);

      const category = await Category.findByPk(item.category_id, { transaction: t });
      const categoryName = category ? category.name : '';

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
          category_name_snapshot: categoryName,
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

async function deleteSale(shopId, saleId, userId = null) {
  return sequelize.transaction(async (t) => {
    const sale = await Sale.findOne(
      { where: { id: saleId, shop_id: shopId } },
      { transaction: t, lock: t.LOCK.UPDATE }
    );
    if (!sale) throw new AppError('Sale not found.', 404);

    // Get all sale items to restore stock
    const saleItems = await SaleItem.findAll(
      { where: { sale_id: saleId, shop_id: shopId } },
      { transaction: t }
    );

    // Restore stock and create stock movements
    for (const saleItem of saleItems) {
      const item = await Item.findByPk(saleItem.item_id, { transaction: t, lock: t.LOCK.UPDATE });
      if (item) {
        item.quantity += saleItem.quantity;
        await item.save({ transaction: t });
        await StockMovement.create(
          {
            shop_id: shopId,
            item_id: saleItem.item_id,
            movement_type: 'IN',
            quantity_delta: saleItem.quantity,
            note: `Sale #${saleId} deletion reversal`,
          },
          { transaction: t }
        );
      }
    }

    // Create history record with DELETE operation and store all sale data
    const saleDataSnapshot = {
      id: sale.id,
      shop_id: sale.shop_id,
      sold_at: sale.sold_at,
      total_amount: sale.total_amount,
      total_profit: sale.total_profit,
      items: saleItems.map((si) => ({
        id: si.id,
        item_id: si.item_id,
        item_name_snapshot: si.item_name_snapshot,
        model_snapshot: si.model_snapshot,
        category_name_snapshot: si.category_name_snapshot,
        quantity: si.quantity,
        cost_price_at_sale: si.cost_price_at_sale,
        selling_price_each: si.selling_price_each,
        profit_each: si.profit_each,
        line_total: si.line_total,
        line_profit: si.line_profit,
      })),
    };

    await SaleHistory.create(
      {
        original_id: sale.id,
        shop_id: shopId,
        user_id: userId,
        operation_type: 'DELETE',
        data_snapshot: JSON.stringify(saleDataSnapshot),
        created_at: new Date(),
      },
      { transaction: t }
    );

    // Delete sale items and sale
    await SaleItem.destroy({ where: { sale_id: saleId }, transaction: t });
    await Sale.destroy({ where: { id: saleId }, transaction: t });

    return { success: true, message: 'Sale deleted and backed up.' };
  });
}

async function listDeletedSalesHistory(shopId, { limit = 200, offset = 0 } = {}) {
  const results = await SaleHistory.findAndCountAll({
    where: { shop_id: shopId, operation_type: 'DELETE' },
    order: [['created_at', 'DESC']],
    limit: Math.min(Number(limit) || 200, 1000),
    offset: Math.max(0, Number(offset) || 0),
  });

  return {
    data: results.rows.map((h) => {
      let dataSnapshot = {};
      try {
        dataSnapshot = JSON.parse(h.data_snapshot);
      } catch {
        // If parse fails, use empty snapshot
      }
      return {
        id: h.id,
        original_id: h.original_id,
        deleted_at: h.created_at,
        sale_data: dataSnapshot,
      };
    }),
    count: results.count,
  };
}

async function hardDeleteSaleHistory(shopId, historyId) {
  const history = await SaleHistory.findOne({
    where: { id: historyId, shop_id: shopId, operation_type: 'DELETE' },
  });
  if (!history) throw new AppError('History record not found.', 404);
  await SaleHistory.destroy({ where: { id: historyId } });
  return { success: true, message: 'History record permanently deleted.' };
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
  deleteSale,
  listDeletedSalesHistory,
  hardDeleteSaleHistory,
};

