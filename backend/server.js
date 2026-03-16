require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { sequelize } = require('./models');
const { AppError } = require('./services/errors');

const categoriesRoutes = require('./routes/categories');
const itemsRoutes = require('./routes/items');
const salesRoutes = require('./routes/sales');
const servicesRoutes = require('./routes/services');
const reportsRoutes = require('./routes/reports');
const excelRoutes = require('./routes/excel');

const app = express();

app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173' }));
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

app.use('/api/categories', categoriesRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/excel', excelRoutes);

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
  // In dev, auto-create tables if they don't exist.
  // For production, run database/schema.sql manually and keep sync disabled.
  await sequelize.sync();

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

