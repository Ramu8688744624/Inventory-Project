const { Sequelize } = require('sequelize');

const {
  DATABASE_URL,
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME,
  DB_USER,
  DB_PASS,
  NODE_ENV = 'development',
} = process.env;

if (!DATABASE_URL && (!DB_NAME || !DB_USER)) {
  throw new Error('Missing DATABASE_URL or DB_NAME/DB_USER in environment variables.');
}

const sequelizeConfig = {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: NODE_ENV === 'development' ? false : false,
  define: {
    underscored: true,
    freezeTableName: true,
  },
  pool: {
    max: 20,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    ssl:
      process.env.DB_SSL === 'true' || NODE_ENV === 'production' || (DATABASE_URL && DATABASE_URL.includes('sslmode=require'))
        ? {
            require: true,
            rejectUnauthorized: false,
          }
        : false,
  },
};

const sequelize = DATABASE_URL
  ? new Sequelize(DATABASE_URL, sequelizeConfig)
  : new Sequelize(DB_NAME, DB_USER, DB_PASS || '', {
      ...sequelizeConfig,
      host: DB_HOST,
      port: Number(DB_PORT),
    });

module.exports = { sequelize };

