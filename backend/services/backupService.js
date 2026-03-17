const { sequelize, Shop, Category, Item, Sale, SaleItem, ServiceIncome, StockMovement, CategoryHistory, ItemHistory, SaleHistory, ServiceIncomeHistory } = require('../models');
const { AppError } = require('./errors');

async function exportBackup(shopId) {
  const shop = await Shop.findByPk(shopId);
  if (!shop) throw new AppError('Shop not found.', 404);

  const [categories, items, sales, serviceIncome] = await Promise.all([
    Category.findAll({ where: { shop_id: shopId }, raw: true }),
    Item.findAll({ where: { shop_id: shopId }, raw: true }),
    Sale.findAll({ where: { shop_id: shopId }, raw: true }),
    ServiceIncome.findAll({ where: { shop_id: shopId }, raw: true }),
  ]);

  const saleIds = sales.map((s) => s.id);
  const saleItems = saleIds.length
    ? await SaleItem.findAll({ where: { shop_id: shopId }, raw: true })
    : [];

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    shopId: Number(shopId),
    shop: {
      id: shop.id,
      name: shop.name,
      city: shop.city,
      state: shop.state,
      country: shop.country,
      currency_code: shop.currency_code,
      low_stock_threshold: shop.low_stock_threshold,
    },
    categories,
    items,
    sales,
    sale_items: saleItems,
    service_income: serviceIncome,
  };
}

async function importBackup(shopId, data) {
  if (!data || typeof data !== 'object') throw new AppError('Invalid backup data.', 400);
  if (!data.categories || !Array.isArray(data.categories)) throw new AppError('Invalid backup format: categories required.', 400);

  const shop = await Shop.findByPk(shopId);
  if (!shop) throw new AppError('Shop not found.', 404);

  const items = Array.isArray(data.items) ? data.items : [];
  const sales = Array.isArray(data.sales) ? data.sales : [];
  const saleItems = Array.isArray(data.sale_items) ? data.sale_items : [];
  const serviceIncome = Array.isArray(data.service_income) ? data.service_income : [];

  return sequelize.transaction(async (t) => {
    const catMap = {};
    const itemMap = {};
    const saleMap = {};

    await SaleItem.destroy({ where: { shop_id: shopId }, transaction: t });
    await Sale.destroy({ where: { shop_id: shopId }, transaction: t });
    await StockMovement.destroy({ where: { shop_id: shopId }, transaction: t });
    await Item.destroy({ where: { shop_id: shopId }, transaction: t });
    await ServiceIncome.destroy({ where: { shop_id: shopId }, transaction: t });
    await Category.destroy({ where: { shop_id: shopId }, transaction: t });

    for (const c of data.categories) {
      const created = await Category.create(
        {
          shop_id: shopId,
          name: String(c.name || '').trim(),
          is_active: c.is_active !== false,
        },
        { transaction: t }
      );
      catMap[c.id] = created.id;
    }

    for (const i of items) {
      const newCatId = catMap[i.category_id] || null;
      if (!newCatId) continue;
      const created = await Item.create(
        {
          shop_id: shopId,
          category_id: newCatId,
          item_name: String(i.item_name || ''),
          model: String(i.model || ''),
          cost_price: Number(i.cost_price) || 0,
          selling_price: Number(i.selling_price) || 0,
          quantity: Number(i.quantity) || 0,
          is_active: i.is_active !== false,
        },
        { transaction: t }
      );
      itemMap[i.id] = created.id;
    }

    for (const s of sales) {
      const created = await Sale.create(
        {
          shop_id: shopId,
          sold_at: s.sold_at ? new Date(s.sold_at) : new Date(),
          total_amount: Number(s.total_amount) || 0,
          total_profit: Number(s.total_profit) || 0,
        },
        { transaction: t }
      );
      saleMap[s.id] = created.id;
    }

    for (const si of saleItems) {
      const newSaleId = saleMap[si.sale_id];
      const newItemId = itemMap[si.item_id];
      if (!newSaleId || !newItemId) continue;
      const item = await Item.findByPk(newItemId, { include: ['category'], transaction: t });
      if (!item) continue;
      await SaleItem.create(
        {
          sale_id: newSaleId,
          shop_id: shopId,
          item_id: newItemId,
          category_id: item.category_id,
          item_name_snapshot: si.item_name_snapshot || item.item_name,
          model_snapshot: si.model_snapshot || item.model,
          category_name_snapshot: item.category ? item.category.name : '',
          quantity: Number(si.quantity) || 0,
          cost_price_at_sale: Number(si.cost_price_at_sale) || 0,
          selling_price_each: Number(si.selling_price_each) || 0,
          profit_each: Number(si.profit_each) || 0,
          line_total: Number(si.line_total) || 0,
          line_profit: Number(si.line_profit) || 0,
        },
        { transaction: t }
      );
    }

    for (const svc of serviceIncome) {
      await ServiceIncome.create(
        {
          shop_id: shopId,
          service_name: String(svc.service_name || ''),
          amount: Number(svc.amount) || 0,
          service_date: svc.service_date ? String(svc.service_date).slice(0, 10) : new Date().toISOString().slice(0, 10),
          notes: svc.notes ? String(svc.notes) : null,
        },
        { transaction: t }
      );
    }

    return {
      categories: data.categories.length,
      items: items.length,
      sales: sales.length,
      sale_items: saleItems.length,
      service_income: serviceIncome.length,
    };
  });
}

async function exportHistory(shopId) {
  const shop = await Shop.findByPk(shopId);
  if (!shop) throw new AppError('Shop not found.', 404);

  const [categories, items, sales, serviceIncome] = await Promise.all([
    CategoryHistory.findAll({ where: { shop_id: shopId }, raw: true, order: [['created_at','ASC']] }),
    ItemHistory.findAll({ where: { shop_id: shopId }, raw: true, order: [['created_at','ASC']] }),
    SaleHistory.findAll({ where: { shop_id: shopId }, raw: true, order: [['created_at','ASC']] }),
    ServiceIncomeHistory.findAll({ where: { shop_id: shopId }, raw: true, order: [['created_at','ASC']] }),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    shopId: Number(shopId),
    shop: {
      id: shop.id,
      name: shop.name,
      city: shop.city,
      state: shop.state,
      country: shop.country,
      currency_code: shop.currency_code,
      low_stock_threshold: shop.low_stock_threshold,
    },
    categories,
    items,
    sales,
    service_income,
  };
}

async function restoreHistory(shopId, data) {
  if (!data || typeof data !== 'object') throw new AppError('Invalid history backup data.', 400);

  const shop = await Shop.findByPk(shopId);
  if (!shop) throw new AppError('Shop not found.', 404);

  const categorySnapshots = Array.isArray(data.categories) ? data.categories : [];
  const itemSnapshots = Array.isArray(data.items) ? data.items : [];
  const saleSnapshots = Array.isArray(data.sales) ? data.sales : [];
  const serviceSnapshots = Array.isArray(data.service_income) ? data.service_income : [];

  return sequelize.transaction(async (t) => {
    await StockMovement.destroy({ where: { shop_id: shopId }, transaction: t });
    await SaleItem.destroy({ where: { shop_id: shopId }, transaction: t });
    await Sale.destroy({ where: { shop_id: shopId }, transaction: t });
    await Item.destroy({ where: { shop_id: shopId }, transaction: t });
    await ServiceIncome.destroy({ where: { shop_id: shopId }, transaction: t });
    await Category.destroy({ where: { shop_id: shopId }, transaction: t });

    const parseSnapshot = (row) => {
      if (!row || !row.data_snapshot) return null;
      try {
        return typeof row.data_snapshot === 'string' ? JSON.parse(row.data_snapshot) : row.data_snapshot;
      } catch {
        return null;
      }
    };

    const sortedCategories = categorySnapshots.slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const finalCategories = sortedCategories.reduce((acc, row) => {
      const key = String(row.original_id);
      if (row.operation_type !== 'DELETE') {
        acc[key] = parseSnapshot(row) || {};
      } else {
        delete acc[key];
      }
      return acc;
    }, {});

    const sortedItems = itemSnapshots.slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const finalItems = sortedItems.reduce((acc, row) => {
      const key = String(row.original_id);
      if (row.operation_type !== 'DELETE') {
        acc[key] = parseSnapshot(row) || {};
      } else {
        delete acc[key];
      }
      return acc;
    }, {});

    const sortedSales = saleSnapshots.slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const finalSales = sortedSales.reduce((acc, row) => {
      const key = String(row.original_id);
      if (row.operation_type !== 'DELETE') {
        acc[key] = parseSnapshot(row) || {};
      } else {
        delete acc[key];
      }
      return acc;
    }, {});

    const sortedService = serviceSnapshots.slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const finalService = sortedService.reduce((acc, row) => {
      const key = String(row.original_id);
      if (row.operation_type !== 'DELETE') {
        acc[key] = parseSnapshot(row) || {};
      } else {
        delete acc[key];
      }
      return acc;
    }, {});

    const categoryIdMap = {};
    for (const row of Object.values(finalCategories)) {
      const created = await Category.create({ shop_id: shopId, name: row.name, is_active: row.is_active }, { transaction: t });
      if (row.id != null) {
        categoryIdMap[String(row.id)] = created.id;
      }
    }

    const itemIdMap = {};
    for (const row of Object.values(finalItems)) {
      const oldCat = categoryIdMap[String(row.category_id)];
      if (!oldCat) continue;
      const created = await Item.create(
        {
          shop_id: shopId,
          category_id: oldCat,
          item_name: row.item_name,
          model: row.model,
          cost_price: row.cost_price,
          selling_price: row.selling_price,
          quantity: row.quantity,
          is_active: row.is_active,
        },
        { transaction: t }
      );
      if (row.id != null) {
        itemIdMap[String(row.id)] = created.id;
      }
    }

    for (const saleData of Object.values(finalSales)) {
      await Sale.create(
        {
          shop_id: shopId,
          sold_at: saleData.sold_at,
          total_amount: saleData.total_amount,
          total_profit: saleData.total_profit,
        },
        { transaction: t }
      );
      // Note: sale items are not stored in sales_history; use full data export/import for exact item-level details.
    }

    for (const svcData of Object.values(finalService)) {
      await ServiceIncome.create(
        {
          shop_id: shopId,
          service_name: svcData.service_name,
          amount: svcData.amount,
          service_date: svcData.service_date,
          notes: svcData.notes,
        },
        { transaction: t }
      );
    }

    return {
      categories: Object.keys(finalCategories).length,
      items: Object.keys(finalItems).length,
      sales: Object.keys(finalSales).length,
      service_income: Object.keys(finalService).length,
    };
  });
}

module.exports = { exportBackup, importBackup, exportHistory, restoreHistory };
