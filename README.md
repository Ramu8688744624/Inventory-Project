# Inventory & Profit Management (JaiBhajarang Mobiles)

Lightweight Inventory + Sales POS + Profit tracking web app.

## Folder structure

- `database/schema.sql` (MySQL schema + default shop seed)
- `backend/` (Node.js + Express + Sequelize, `http://localhost:5000`)
- `frontend/` (React + Vite, `http://localhost:5173`)

## 1) Database setup (MySQL)

1. Create a database (example name used below): `jaibhajarang_inventory`
2. Run the schema:

```sql
-- in MySQL client:
SOURCE database/schema.sql;
```

> If you didn't `USE` your database in the client, run `USE jaibhajarang_inventory;` first.

## 2) Backend setup

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

Edit `backend/.env` with your MySQL credentials.

## 3) Frontend setup

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

## Branding / multi-business reuse

- **Branding**: edit `frontend/src/services/shopConfig.js` (shop name/city/currency symbol)
- **Multi-business**: the backend supports `x-shop-id` header (defaults to `SHOP_ID` in `backend/.env`).

## API endpoints (REST)

Base URL: `http://localhost:5000/api`

### Categories
- `GET /categories`
- `POST /categories` `{ name }`
- `PUT /categories/:id` `{ name?, is_active? }`
- `DELETE /categories/:id` (blocked if items exist)

### Items / Inventory
- `GET /items?categoryId=&q=`
- `GET /items/:id`
- `POST /items` `{ category_id, item_name, model, cost_price, selling_price, quantity }`
- `PUT /items/:id` `{ category_id?, item_name?, model?, cost_price?, selling_price?, quantity?, is_active? }`
- `POST /items/:id/add-stock` `{ quantity, note? }`
- `DELETE /items/:id` (blocked if sales exist; deactivate instead)

### Sales
- `POST /sales` `{ sold_at?, items: [{ item_id, quantity, selling_price_each? }] }`
- `GET /sales?filter=today|week|month|custom&from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /sales/item/:itemId/history`

### Service income
- `POST /services` `{ service_name, amount, service_date: YYYY-MM-DD, notes? }`
- `GET /services?filter=today|week|month|custom&from=YYYY-MM-DD&to=YYYY-MM-DD`
- `DELETE /services/:id`

### Reports
- `GET /reports/dashboard`
- `GET /reports/stock?categoryId=`
- `GET /reports/out-of-stock`
- `GET /reports/low-stock`
- `GET /reports/profit/summary?filter=...`
- `GET /reports/profit/by-category?filter=...`
- `GET /reports/profit/by-item?filter=...&limit=`

### Excel
- `POST /excel/import/inventory` (multipart form-data: `file` = `.xlsx`)
- `GET /excel/export/inventory` (downloads `.xlsx`)

### Backup & Restore
- `GET /backup/export` (downloads `inventory-backup.json`)
- `POST /backup/import` (body: JSON backup; replaces shop data)

### Auth (optional, when `AUTH_ENABLED=1`)
- `POST /auth/register` `{ email, password }`
- `POST /auth/login` `{ email, password }`
- `POST /auth/verify-email` `{ token }`
- `POST /auth/forgot-password` `{ email }`
- `POST /auth/reset-password` `{ token, newPassword }`
- `GET /auth/config` (returns `{ authEnabled }`)

