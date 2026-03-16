const { Op } = require('sequelize');
const { ServiceIncome } = require('../models');
const { AppError } = require('./errors');
const { rangeForFilter } = require('./salesService');

async function createServiceIncome(shopId, payload) {
  const service_name = String(payload.service_name || '').trim();
  const amount = Number(payload.amount);
  const service_date = payload.service_date ? String(payload.service_date) : null;
  const notes = payload.notes === undefined ? null : String(payload.notes);

  if (!service_name) throw new AppError('service_name is required.', 400);
  if (!Number.isFinite(amount) || amount <= 0) throw new AppError('amount must be > 0.', 400);
  if (!service_date) throw new AppError('service_date is required (YYYY-MM-DD).', 400);

  return ServiceIncome.create({ shop_id: shopId, service_name, amount, service_date, notes });
}

async function listServiceIncome(shopId, { filter, from, to, limit = 200 } = {}) {
  const where = { shop_id: shopId };
  const range = rangeForFilter(filter, { from, to });
  if (range.from && range.to) {
    // compare date only
    const f = range.from.toISOString().slice(0, 10);
    const t = range.to.toISOString().slice(0, 10);
    where.service_date = { [Op.between]: [f, t] };
  }

  return ServiceIncome.findAll({
    where,
    order: [['service_date', 'DESC'], ['id', 'DESC']],
    limit: Math.min(Number(limit) || 200, 1000),
  });
}

async function deleteServiceIncome(shopId, id) {
  const row = await ServiceIncome.findOne({ where: { id, shop_id: shopId } });
  if (!row) throw new AppError('Service income not found.', 404);
  await row.destroy();
  return { ok: true };
}

module.exports = { createServiceIncome, listServiceIncome, deleteServiceIncome };

