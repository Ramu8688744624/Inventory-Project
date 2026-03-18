require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { DataTypes } = require('sequelize');
const { sequelize, Shop, User } = require('./models');
const { setDefaultShopId } = require('./services/shopContext');
const { AppError } = require('./services/errors');

const categoriesRoutes = require('./routes/categories');
const itemsRoutes = require('./routes/items');
const salesRoutes = require('./routes/sales');
const servicesRoutes = require('./routes/services');
const reportsRoutes = require('./routes/reports');
const excelRoutes = require('./routes/excel');
const backupRoutes = require('./routes/backup');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173' }));
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Pragma', 'no-cache')
  next()
})
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/health', (req, res) => res.json({ ok: true }));

app.use((req, res, next) => {
  req.user = { id: 1, shop_id: 1, role: 'admin' };
  req.userId = 1;
  req.userShopId = 1;
  req.userRole = 'admin';
  if (!req.shopId) req.shopId = 1;
  next();
});

app.use('/api/categories', categoriesRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/excel', excelRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res, next) => next(new AppError('Not found', 404)));

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || 'Server error';

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ error: 'Duplicate record (unique constraint).', details: err.errors });
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({ error: 'Operation violates foreign key constraint.' });
  }
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ error: 'Validation error.', details: err.errors });
  }

  res.status(status).json({ error: message, details: err.details });
});

const PORT = Number(process.env.PORT || 5000);

async function start() {
  await sequelize.authenticate();

  // Ensure history table schema migration to new column names and fields
  const qi = sequelize.getQueryInterface();
  const historyConfigs = [
    { table: 'categories_history', oldId: 'category_id' },
    { table: 'items_history', oldId: 'item_id' },
    { table: 'sales_history', oldId: 'sale_id' },
    { table: 'service_income_history', oldId: 'service_income_id' },
  ];

  for (const cfg of historyConfigs) {
    try {
      const desc = await qi.describeTable(cfg.table);
      if (!desc.original_id) {
        await qi.addColumn(cfg.table, 'original_id', {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
        });
        if (desc[cfg.oldId]) {
          await sequelize.query('UPDATE `' + cfg.table + '` SET original_id = `' + cfg.oldId + '`');
        }
      }
      if (!desc.data_snapshot) {
        await qi.addColumn(cfg.table, 'data_snapshot', {
          type: DataTypes.TEXT,
          allowNull: true,
        });
        // populate from existing record fields when possible
        if (desc[cfg.oldId]) {
          // leave as null for now
        }
      }
    } catch (e) {
      // Table may not exist yet; ignore
    }
  }

  // In dev, auto-create/alter tables to match models.
  // For production, run database/schema.sql manually and keep sync disabled.
  if (process.env.NODE_ENV === 'production') {
    await sequelize.sync({ alter: false });
  } else {
    await sequelize.sync({ alter: true });
  }

  // Ensure there is at least one default shop so foreign keys never fail
  // on a fresh installation. This is idempotent and safe in production.
  const existingCount = await Shop.count();
  if (existingCount === 0) {
    const created = await Shop.create({
      name: 'JaiBhajarang Mobiles',
      city: 'Karimnagar',
      state: 'Telangana',
      country: 'India',
    });
    // eslint-disable-next-line no-console
    console.log(`Created default shop with id=${created.id}`);
    if (!process.env.SHOP_ID) {
      process.env.SHOP_ID = String(created.id);
    }
    setDefaultShopId(created.id);
  } else if (!process.env.SHOP_ID) {
    // If shops already exist but SHOP_ID is not set, default to first shop.
    const first = await Shop.findOne({ order: [['id', 'ASC']] });
    if (first) {
      process.env.SHOP_ID = String(first.id);
      setDefaultShopId(first.id);
      // eslint-disable-next-line no-console
      console.log(`Using existing shop id=${first.id} as default SHOP_ID`);
    }
  }

  // No auth required in single-user mode, still keep default admin user row if combined with existing user table.
  const userCount = await User.count();
  if (userCount === 0) {
    await User.create({
      shop_id: Number(process.env.SHOP_ID) || (await Shop.findOne({ order: [['id', 'ASC']] })).id,
      email: 'admin@example.com',
      password_hash: 'noauth',
      role: 'admin',
      is_active: true,
      verified: true,
      settings: {}
    });
  }

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

start().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

