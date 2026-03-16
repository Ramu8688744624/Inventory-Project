function getShopId(req) {
  const header = req.header('x-shop-id');
  const shopId = header ? Number(header) : Number(process.env.SHOP_ID || 1);
  if (!Number.isFinite(shopId) || shopId <= 0) return 1;
  return shopId;
}

module.exports = { getShopId };

