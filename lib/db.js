require('dotenv').config();
const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'autoservice',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4_unicode_ci',
  dateStrings: true
};

let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool(config);
  }
  return pool;
}

async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

async function ping() {
  const conn = await getPool().getConnection();
  try {
    await conn.ping();
    return true;
  } finally {
    conn.release();
  }
}

function getConfig() {
  return { host: config.host, port: config.port, user: config.user, database: config.database };
}

module.exports = { query, ping, getPool, getConfig };
