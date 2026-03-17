const { sequelize } = require('../config/db');

const Shop = require('./shop')(sequelize);
const ShopLabel = require('./shopLabel')(sequelize);
const Category = require('./category')(sequelize);
const Item = require('./item')(sequelize);
const StockMovement = require('./stockMovement')(sequelize);
const Sale = require('./sale')(sequelize);
const SaleItem = require('./saleItem')(sequelize);
const ServiceIncome = require('./serviceIncome')(sequelize);
const CategoryHistory = require('./categoryHistory')(sequelize);
const ItemHistory = require('./itemHistory')(sequelize);
const SaleHistory = require('./saleHistory')(sequelize);
const ServiceIncomeHistory = require('./serviceIncomeHistory')(sequelize);
const User = require('./user')(sequelize);
const AuthToken = require('./authToken')(sequelize);

// Associations
Shop.hasMany(Category, { foreignKey: 'shop_id' });
Category.belongsTo(Shop, { foreignKey: 'shop_id' });

Shop.hasMany(Item, { foreignKey: 'shop_id' });
Item.belongsTo(Shop, { foreignKey: 'shop_id' });

Category.hasMany(Item, { foreignKey: 'category_id' });
Item.belongsTo(Category, { foreignKey: 'category_id' });

Shop.hasMany(ShopLabel, { foreignKey: 'shop_id' });
ShopLabel.belongsTo(Shop, { foreignKey: 'shop_id' });

Shop.hasMany(StockMovement, { foreignKey: 'shop_id' });
StockMovement.belongsTo(Shop, { foreignKey: 'shop_id' });
Item.hasMany(StockMovement, { foreignKey: 'item_id' });
StockMovement.belongsTo(Item, { foreignKey: 'item_id' });

Shop.hasMany(Sale, { foreignKey: 'shop_id' });
Sale.belongsTo(Shop, { foreignKey: 'shop_id' });
Sale.hasMany(SaleItem, { foreignKey: 'sale_id' });
SaleItem.belongsTo(Sale, { foreignKey: 'sale_id' });
Item.hasMany(SaleItem, { foreignKey: 'item_id' });
SaleItem.belongsTo(Item, { foreignKey: 'item_id' });
Category.hasMany(SaleItem, { foreignKey: 'category_id' });
SaleItem.belongsTo(Category, { foreignKey: 'category_id' });

Shop.hasMany(ServiceIncome, { foreignKey: 'shop_id' });
ServiceIncome.belongsTo(Shop, { foreignKey: 'shop_id' });

Shop.hasMany(User, { foreignKey: 'shop_id' });
User.belongsTo(Shop, { foreignKey: 'shop_id' });
User.hasMany(AuthToken, { foreignKey: 'user_id' });
AuthToken.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  Shop,
  ShopLabel,
  Category,
  Item,
  StockMovement,
  Sale,
  SaleItem,
  ServiceIncome,
  CategoryHistory,
  ItemHistory,
  SaleHistory,
  ServiceIncomeHistory,
  User,
  AuthToken,
};

