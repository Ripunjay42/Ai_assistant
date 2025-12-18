import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Ensure dotenv is loaded
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: true,
        ca: process.env.DB_CA_CERT ? process.env.DB_CA_CERT.replace(/\\n/g, '\n') : undefined
      }
    }
  }
);

export default sequelize;
