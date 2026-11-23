require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const repo = require('./lib/repo');

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.disable('x-powered-by');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h' }));

app.use(
  session({
    name: 'as.sid',
    secret: process.env.SESSION_SECRET || 'autoservice-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

app.use((req, res, next) => {
  res.locals.year = new Date().getFullYear();
  res.locals.demoMode = repo.isDemoMode();
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  res.locals.admin = req.session.admin || null;
  next();
});

// ---------- helpers ----------
const PHONE_RE = /^[+()\d\s-]{10,20}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function money(value) {
  return new Intl.NumberFormat('ru-RU').format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

app.locals.money = money;
app.locals.formatDate = formatDate;

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// примитивный антифлуд для формы записи
const lastPost = new Map();
function tooFrequent(ip) {
  const now = Date.now();
  const prev = lastPost.get(ip) || 0;
  if (now - prev < 5000) return true;
  lastPost.set(ip, now);
  return false;
}

// ---------- публичные страницы ----------
app.get(
  '/',
  asyncHandler(async (req, res) => {
    const [services, masters, reviews] = await Promise.all([
      repo.listServices(),
      repo.listMasters(),
      repo.listReviews(6)
    ]);

    res.render('index', {
      title: 'Автосервис «ТурбоДоктор» — честный ремонт автомобилей',
      page: 'home',
      services: services.slice(0, 6),
      masters,
      reviews
    });
  })
);

app.get(
  '/services',
  asyncHandler(async (req, res) => {
    const services = await repo.listServices();
    res.render('services', {
      title: 'Услуги и цены',
      page: 'services',
      services
    });
  })
);

app.get(
  '/booking',
  asyncHandler(async (req, res) => {
    const services = await repo.listServices();
    res.render('booking', {
      title: 'Запись на ремонт',
      page: 'booking',
      services,
      values: { service_id: req.query.service || '' },
      errors: [],
      success: req.query.ok === '1'
    });
  })
);

app.post(
  '/booking',
  asyncHandler(async (req, res) => {
    const services = await repo.listServices();
    const values = {
      service_id: (req.body.service_id || '').trim(),
      client_name: (req.body.client_name || '').trim(),
      phone: (req.body.phone || '').trim(),
      car_model: (req.body.car_model || '').trim(),
      preferred_date: (req.body.preferred_date || '').trim(),
      comment: (req.body.comment || '').trim()
    };

    const errors = [];
    if (values.client_name.length < 2 || values.client_name.length > 60) {
      errors.push('Укажите имя (от 2 до 60 символов).');
    }
    if (!PHONE_RE.test(values.phone)) {
      errors.push('Укажите корректный телефон, например +7 999 123-45-67.');
    }
    if (values.service_id && !services.some((s) => String(s.id) === values.service_id)) {
      errors.push('Выберите услугу из списка.');
    }
    if (values.preferred_date && !DATE_RE.test(values.preferred_date)) {
      errors.push('Дата должна быть в формате ГГГГ-ММ-ДД.');
    }
    if (values.car_model.length > 80) errors.push('Слишком длинное название автомобиля.');
    if (values.comment.length > 600) errors.push('Комментарий длиннее 600 символов.');

    if (errors.length) {
      return res.status(422).render('booking', {
        title: 'Запись на ремонт',
        page: 'booking',
        services,
        values,
        errors,
        success: false
      });
    }

    if (tooFrequent(req.ip)) {
      req.session.flash = { type: 'error', text: 'Слишком часто. Попробуйте отправить форму через минуту.' };
      return res.redirect('/booking');
    }

    await repo.createBooking({
      service_id: values.service_id ? Number(values.service_id) : null,
      client_name: values.client_name,
      phone: values.phone,
      car_model: values.car_model,
      preferred_date: values.preferred_date || null,
      comment: values.comment
    });

    req.session.flash = { type: 'success', text: 'Заявка принята! Мастер-приёмщик позвонит в течение 15 минут.' };
    return res.redirect('/booking?ok=1');
  })
);

app.get(
  '/contacts',
  (req, res) => {
    res.render('contacts', {
      title: 'Контакты',
      page: 'contacts'
    });
  }
);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: repo.isDemoMode() ? 'demo' : 'mysql',
    uptime: Math.round(process.uptime())
  });
});

// ---------- админка ----------
function requireAdmin(req, res, next) {
  if (req.session.admin) return next();
  req.session.flash = { type: 'error', text: 'Войдите в панель управления.' };
  return res.redirect('/admin/login');
}

app.get('/admin/login', (req, res) => {
  if (req.session.admin) return res.redirect('/admin');
  res.render('admin/login', { title: 'Вход в панель', page: 'admin' });
});

app.post(
  '/admin/login',
  asyncHandler(async (req, res) => {
    const username = (req.body.username || '').trim();
    const password = req.body.password || '';
    const ok = username && password ? await repo.checkAdmin(username, password) : false;

    if (!ok) {
      return res.status(401).render('admin/login', {
        title: 'Вход в панель',
        page: 'admin',
        error: 'Неверный логин или пароль.',
        username
      });
    }

    req.session.admin = { username };
    res.redirect('/admin');
  })
);

app.post('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

app.get(
  '/admin',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const [bookings, stats] = await Promise.all([repo.listBookings(100), repo.bookingStats()]);
    res.render('admin/dashboard', {
      title: 'Панель управления',
      page: 'admin',
      bookings,
      stats
    });
  })
);

app.post(
  '/admin/bookings/:id/status',
  requireAdmin,
  asyncHandler(async (req, res) => {
    try {
      await repo.updateBookingStatus(req.params.id, req.body.status);
      req.session.flash = { type: 'success', text: 'Статус заявки обновлён.' };
    } catch (err) {
      req.session.flash = { type: 'error', text: err.message };
    }
    res.redirect('/admin');
  })
);

// ---------- 404 / ошибки ----------
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Страница не найдена',
    page: '',
    code: 404,
    message: 'Такой страницы нет. Возможно, ссылка устарела.'
  });
});

app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(500).render('error', {
    title: 'Ошибка сервера',
    page: '',
    code: 500,
    message: 'Что-то пошло не так. Попробуйте обновить страницу позже.'
  });
});

(async () => {
  const ok = await repo.warmUp();
  app.listen(PORT, () => {
    console.log(`Автосервис: http://localhost:${PORT}`);
    if (!ok) {
      console.warn('MySQL недоступна — сайт работает в демо-режиме. Запустите: npm run db:init');
    }
  });
})();
