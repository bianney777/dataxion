// config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.DB_NAME || 'dataxion',
  port: process.env.DB_PORT || 4040
};

let connection;

const connectDB = async () => {
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('MySQL Connected...');
  } catch (err) {
    console.error('Database connection failed: ', err.message);
    process.exit(1);
  }
};

const getConnection = () => {
  return connection;
};

module.exports = { connectDB, getConnection };