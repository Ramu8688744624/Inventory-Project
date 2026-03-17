const ExcelJS = require('exceljs');
const { sequelize, Category, Item, StockMovement } = require('../models');
const { AppError } = require('./errors');

function normalizeHeader(v) {
  return String(v || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

async function importInventoryFromExcel(shopId, filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new AppError('Excel file has no sheets.', 400);

  const headerRow = sheet.getRow(1);
  const headers = {};
  headerRow.eachCell((cell, colNumber) => {
    const key = normalizeHeader(cell.value);
    headers[key] = colNumber;
  });

  const required = ['category', 'item name', 'model', 'cost price', 'selling price', 'quantity'];
  for (const r of required) {
    if (!headers[r]) throw new AppError(`Missing column: ${r}`, 400);
  }

  const rows = [];
  for (let r = 2; r <= sheet.rowCount; r += 1) {
    const row = sheet.getRow(r);
    const categoryName = String(row.getCell(headers['category']).value || '').trim();
    const itemName = String(row.getCell(headers['item name']).value || '').trim();
    const model = String(row.getCell(headers['model']).value || '').trim();
    const costPrice = Number(row.getCell(headers['cost price']).value);
    const sellingPrice = Number(row.getCell(headers['selling price']).value);
    const quantity = Number(row.getCell(headers['quantity']).value);

    if (!categoryName || !itemName || !model) continue;
    if (!Number.isFinite(costPrice) || !Number.isFinite(sellingPrice) || !Number.isFinite(quantity)) continue;

    rows.push({ categoryName, itemName, model, costPrice, sellingPrice, quantity: Math.max(0, Math.trunc(quantity)) });
  }

  return sequelize.transaction(async (t) => {
    let created = 0;
    let updated = 0;
    for (const r of rows) {
      const [category] = await Category.findOrCreate({
        where: { shop_id: shopId, name: r.categoryName },
        defaults: { shop_id: shopId, name: r.categoryName },
        transaction: t,
      });

      const existing = await Item.findOne({
        where: { shop_id: shopId, item_name: r.itemName, model: r.model },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (existing) {
        existing.category_id = category.id;
        existing.cost_price = r.costPrice;
        existing.selling_price = r.sellingPrice;
        const delta = r.quantity - Number(existing.quantity);
        existing.quantity = r.quantity;
        await existing.save({ transaction: t });
        if (delta !== 0) {
          await StockMovement.create(
            {
              shop_id: shopId,
              item_id: existing.id,
              movement_type: 'ADJUST',
              quantity_delta: delta,
              note: 'Excel import adjustment',
            },
            { transaction: t }
          );
        }
        updated += 1;
      } else {
        const item = await Item.create(
          {
            shop_id: shopId,
            category_id: category.id,
            item_name: r.itemName,
            model: r.model,
            cost_price: r.costPrice,
            selling_price: r.sellingPrice,
            quantity: r.quantity,
          },
          { transaction: t }
        );
        if (r.quantity > 0) {
          await StockMovement.create(
            { shop_id: shopId, item_id: item.id, movement_type: 'IN', quantity_delta: r.quantity, note: 'Excel import' },
            { transaction: t }
          );
        }
        created += 1;
      }
    }

    return { created, updated, processed: rows.length };
  });
}

async function exportInventoryToExcel(shopId) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Inventory');

  sheet.columns = [
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Item Name', key: 'item_name', width: 25 },
    { header: 'Model', key: 'model', width: 25 },
    { header: 'Cost Price', key: 'cost_price', width: 12 },
    { header: 'Selling Price', key: 'selling_price', width: 12 },
    { header: 'Quantity', key: 'quantity', width: 10 },
  ];

  const items = await Item.findAll({
    where: { shop_id: shopId, is_active: true },
    include: [{ model: Category, attributes: ['name'] }],
    order: [['item_name', 'ASC'], ['model', 'ASC']],
  });

  for (const i of items) {
    sheet.addRow({
      category: i.category ? i.category.name : '',
      item_name: i.item_name,
      model: i.model,
      cost_price: Number(i.cost_price),
      selling_price: Number(i.selling_price),
      quantity: Number(i.quantity),
    });
  }

  return workbook.xlsx.writeBuffer();
}

async function exportInventoryTemplate() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('InventoryTemplate');

  sheet.columns = [
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Item Name', key: 'item_name', width: 25 },
    { header: 'Model', key: 'model', width: 25 },
    { header: 'Cost Price', key: 'cost_price', width: 12 },
    { header: 'Selling Price', key: 'selling_price', width: 12 },
    { header: 'Quantity', key: 'quantity', width: 10 },
  ];

  sheet.addRow({ category: 'Example Category', item_name: 'Example Item', model: 'Model X', cost_price: 500, selling_price: 700, quantity: 10 });
  return workbook.xlsx.writeBuffer();
}

async function exportCategoriesToExcel(shopId) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Categories');

  sheet.columns = [{ header: 'Category Name', key: 'name', width: 30 }];

  const categories = await Category.findAll({ where: { shop_id: shopId }, order: [['name', 'ASC']] });
  for (const c of categories) {
    sheet.addRow({ name: c.name });
  }

  return workbook.xlsx.writeBuffer();
}

async function exportCategoriesTemplate() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('CategoriesTemplate');
  sheet.columns = [{ header: 'Category Name', key: 'name', width: 30 }];
  sheet.addRow({ name: 'Example Category' });
  return workbook.xlsx.writeBuffer();
}

async function importCategoriesFromExcel(shopId, filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new AppError('Excel file has no sheets.', 400);

  const headerRow = sheet.getRow(1);
  const headers = {};
  headerRow.eachCell((cell, colNumber) => {
    const key = normalizeHeader(cell.value);
    headers[key] = colNumber;
  });

  if (!headers['category name']) throw new AppError('Missing column: category name', 400);

  const names = new Set();
  for (let r = 2; r <= sheet.rowCount; r += 1) {
    const row = sheet.getRow(r);
    const name = String(row.getCell(headers['category name']).value || '').trim();
    if (name) names.add(name);
  }

  if (names.size === 0) return { imported: 0 };

  return sequelize.transaction(async (t) => {
    let imported = 0;
    for (const name of names) {
      const [category, created] = await Category.findOrCreate({
        where: { shop_id: shopId, name },
        defaults: { shop_id: shopId, name },
        transaction: t,
      });
      if (created) imported += 1;
    }
    return { imported };
  });
}

module.exports = {
  importInventoryFromExcel,
  exportInventoryToExcel,
  exportInventoryTemplate,
  importCategoriesFromExcel,
  exportCategoriesToExcel,
  exportCategoriesTemplate,
};

