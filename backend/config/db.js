const { Sequelize } = require('sequelize');

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_NAME,
  DB_USER,
  DB_PASS,
  NODE_ENV = 'development',
} = process.env;

if (!DB_NAME || !DB_USER) {
  throw new Error('Missing DB_NAME or DB_USER in environment variables.');
}

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS || '', {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: 'mysql',
  logging: NODE_ENV === 'development' ? false : false,
  define: {
    underscored: true,
    freezeTableName: true,
  },
});

module.exports = { sequelize };

