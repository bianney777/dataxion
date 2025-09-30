// config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.DB_NAME || 'dataxion',
  port: Number(process.env.DB_PORT) || 4040,
  // Opcional: aumentar timeout si el servicio tarda en iniciar
  connectTimeout: 8000
};

let connection;

async function tryConnect(attempt, max){
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log(`MySQL Connected (attempt ${attempt}) host=${dbConfig.host} port=${dbConfig.port}`);
    return true;
  } catch(err){
    console.error(`MySQL connection error (attempt ${attempt}/${max}): ${err.code || err.message}`);
    if(attempt >= max){
      console.error('Exceeded max DB connection attempts. Verify credentials, host, port and MySQL service status.');
      return false;
    }
    await new Promise(r=>setTimeout(r, 1500));
    return tryConnect(attempt+1, max);
  }
}

const connectDB = async () => {
  const max = Number(process.env.DB_RETRY_ATTEMPTS) || 3;
  const ok = await tryConnect(1, max);
  if(!ok){
    // No salimos inmediatamente: permitimos que la app arranque para mostrar página de mantenimiento si se desea.
    // Si prefieres abortar totalmente, descomenta la siguiente línea:
    // process.exit(1);
  }
};

const getConnection = () => {
  return connection;
};

module.exports = { connectDB, getConnection };