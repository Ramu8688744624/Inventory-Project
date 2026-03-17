let cachedDefaultShopId = null;

function setDefaultShopId(id) {
  const numeric = Number(id);
  if (Number.isFinite(numeric) && numeric > 0) {
    cachedDefaultShopId = numeric;
  }
}

function getShopId(req) {
  if (req?.shopId != null && Number.isFinite(Number(req.shopId))) return Number(req.shopId);

  const header = req?.header?.('x-shop-id');
  const fromHeader = header ? Number(header) : NaN;
  if (Number.isFinite(fromHeader) && fromHeader > 0) return fromHeader;

  const fromEnv = Number(process.env.SHOP_ID || cachedDefaultShopId || 1);
  if (!Number.isFinite(fromEnv) || fromEnv <= 0) return 1;
  return fromEnv;
}

module.exports = { getShopId, setDefaultShopId };

