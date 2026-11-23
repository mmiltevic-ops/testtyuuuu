#!/usr/bin/env node
/**
 * Инициализация базы данных автосервиса:
 *   1. создаёт базу (если её нет),
 *   2. применяет database/schema.sql,
 *   3. наполняет таблицы демо-данными из database/seed.sql,
 *   4. создаёт администратора из ADMIN_USERNAME / ADMIN_PASSWORD.
 *
 * Запуск: npm run db:init
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { hashPassword } = require('../lib/password');

const DB_NAME = process.env.DB_NAME || 'autoservice';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function readSql(file) {
  return fs.readFileSync(path.join(__dirname, '..', 'database', file), 'utf8');
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
    charset: 'utf8mb4_unicode_ci'
  });

  console.log(`Подключение к MySQL: ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 3306}`);

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  console.log(`База «${DB_NAME}» готова.`);

  await connection.changeUser({ database: DB_NAME });

  await connection.query(readSql('schema.sql'));
  console.log('Таблицы созданы (schema.sql).');

  await connection.query(readSql('seed.sql'));
  console.log('Демо-данные загружены (seed.sql).');

  const passwordHash = hashPassword(ADMIN_PASSWORD);
  await connection.execute(
    `INSERT INTO admin_users (username, password_hash)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    [ADMIN_USERNAME, passwordHash]
  );
  console.log(`Администратор «${ADMIN_USERNAME}» создан/обновлён.`);

  const [rows] = await connection.query(
    `SELECT
       (SELECT COUNT(*) FROM services) AS services,
       (SELECT COUNT(*) FROM masters)  AS masters,
       (SELECT COUNT(*) FROM reviews)  AS reviews`
  );

  console.log(`Итого: услуг — ${rows[0].services}, мастеров — ${rows[0].masters}, отзывов — ${rows[0].reviews}.`);
  console.log(`Готово. Запускайте сайт: npm start → http://localhost:${process.env.PORT || 3000}`);

  await connection.end();
}

main().catch((err) => {
  console.error('\nНе удалось инициализировать базу данных.');
  console.error(`Причина: ${err.code || ''} ${err.message}`);

  if (err.code === 'ECONNREFUSED') {
    console.error('Проверьте, что сервер MySQL запущен, и параметры DB_HOST/DB_PORT в .env.');
  } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('Проверьте DB_USER и DB_PASSWORD в .env.');
  } else if (err.code === 'ER_NOT_SUPPORTED_AUTH_MODE') {
    console.error('Измените способ аутентификации пользователя на mysql_native_password или caching_sha2_password.');
  }

  process.exitCode = 1;
});
