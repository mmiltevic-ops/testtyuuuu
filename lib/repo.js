const db = require('./db');
const demo = require('../data/demo-data');
const { verifyPassword } = require('./password');

const DEMO_FALLBACK = String(process.env.DEMO_FALLBACK || 'true') !== 'false';

let dbAvailable = null; // true | false | null (ещё не проверяли)
let lastError = null;

// Записи, созданные в демо-режиме, живут в памяти процесса
const demoBookings = [];
let demoBookingSeq = 1;
const demoStatuses = new Map();

function markUnavailable(err) {
  if (err && !lastError) lastError = err.message;
  dbAvailable = false;
}

async function guard(fn, fallback) {
  if (dbAvailable === false) return fallback();
  try {
    const result = await fn();
    dbAvailable = true;
    return result;
  } catch (err) {
    if (err && err.code && String(err.code).startsWith('ER_')) {
      // База подключена, ошибка SQL — не подменяем данные демо-режимом
      dbAvailable = true;
      throw err;
    }
    markUnavailable(err);
    if (!DEMO_FALLBACK) throw err;
    return fallback();
  }
}

function demoBookingRows() {
  return demoBookings
    .map((b) => ({
      ...b,
      status: demoStatuses.get(b.id) || b.status,
      service_title: (demo.services.find((s) => s.id === b.service_id) || {}).title || '—'
    }))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

async function listServices() {
  return guard(
    () => db.query('SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order, id'),
    () => demo.services
  );
}

async function listMasters() {
  return guard(
    () => db.query('SELECT * FROM masters ORDER BY sort_order, id'),
    () => demo.masters
  );
}

async function listReviews(limit = 6) {
  return guard(
    () =>
      db.query('SELECT * FROM reviews WHERE is_published = 1 ORDER BY created_at DESC LIMIT ?', [
        Number(limit)
      ]),
    () => demo.reviews.slice(0, limit)
  );
}

async function createBooking(data) {
  const payload = [
    data.service_id || null,
    data.client_name,
    data.phone,
    data.car_model || null,
    data.preferred_date || null,
    data.comment || null
  ];

  return guard(
    async () => {
      const result = await db.query(
        `INSERT INTO bookings (service_id, client_name, phone, car_model, preferred_date, comment, status)
         VALUES (?, ?, ?, ?, ?, ?, 'new')`,
        payload
      );
      return result.insertId;
    },
    () => {
      const booking = {
        id: demoBookingSeq++,
        service_id: data.service_id || null,
        client_name: data.client_name,
        phone: data.phone,
        car_model: data.car_model || null,
        preferred_date: data.preferred_date || null,
        comment: data.comment || null,
        status: 'new',
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };
      demoBookings.push(booking);
      return booking.id;
    }
  );
}

async function listBookings(limit = 100) {
  return guard(
    () =>
      db.query(
        `SELECT b.*, s.title AS service_title
         FROM bookings b
         LEFT JOIN services s ON s.id = b.service_id
         ORDER BY b.created_at DESC
         LIMIT ?`,
        [Number(limit)]
      ),
    () => demoBookingRows().slice(0, limit)
  );
}

async function updateBookingStatus(id, status) {
  const allowed = ['new', 'confirmed', 'done', 'cancelled'];
  if (!allowed.includes(status)) throw new Error('Недопустимый статус');

  return guard(
    () => db.query('UPDATE bookings SET status = ? WHERE id = ?', [status, Number(id)]),
    () => {
      demoStatuses.set(Number(id), status);
      return { affectedRows: 1 };
    }
  );
}

async function bookingStats() {
  return guard(
    async () => {
      const rows = await db.query('SELECT status, COUNT(*) AS cnt FROM bookings GROUP BY status');
      const stats = { total: 0, new: 0, confirmed: 0, done: 0, cancelled: 0 };
      rows.forEach((r) => {
        if (r.status in stats) stats[r.status] = Number(r.cnt);
        stats.total += Number(r.cnt);
      });
      return stats;
    },
    () => {
      const rows = demoBookingRows();
      const stats = { total: rows.length, new: 0, confirmed: 0, done: 0, cancelled: 0 };
      rows.forEach((r) => {
        if (r.status in stats) stats[r.status] += 1;
      });
      return stats;
    }
  );
}

// Проверка логина админки: сначала таблица admin_users, затем данные из .env
async function checkAdmin(username, password) {
  const envUser = process.env.ADMIN_USERNAME || 'admin';
  const envPass = process.env.ADMIN_PASSWORD || 'admin123';

  const row = await guard(
    async () => {
      const rows = await db.query(
        'SELECT username, password_hash FROM admin_users WHERE username = ? LIMIT 1',
        [username]
      );
      return rows[0] || null;
    },
    () => null
  );

  if (row) return verifyPassword(password, row.password_hash);
  return username === envUser && password === envPass;
}

function isDemoMode() {
  return dbAvailable === false;
}

function getDbError() {
  return lastError;
}

async function warmUp() {
  try {
    await db.ping();
    dbAvailable = true;
  } catch (err) {
    markUnavailable(err);
  }
  return dbAvailable;
}

module.exports = {
  listServices,
  listMasters,
  listReviews,
  createBooking,
  listBookings,
  updateBookingStatus,
  bookingStats,
  checkAdmin,
  isDemoMode,
  getDbError,
  warmUp
};
