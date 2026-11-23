# Автосервис «ТурбоДоктор» — сайт на Node.js + MySQL

Полноценный сайт автосервиса: витрина услуг, онлайн-запись на ремонт, отзывы, страница контактов
и служебная панель для обработки заявок. Данные хранятся в MySQL, шаблоны рендерятся на сервере.

**Стек:** Node.js 18+, Express 4, MySQL 8 (mysql2), EJS, чистый CSS/JS без сборщика.

---

## Содержание

- [Возможности](#возможности)
- [Требования](#требования)
- [Быстрый старт](#быстрый-старт)
- [Подключение MySQL](#подключение-mysql)
- [Переменные окружения](#переменные-окружения)
- [Админ-панель](#админ-панель)
- [Структура проекта](#структура-проекта)
- [Схема базы данных](#схема-базы-данных)
- [Скрипты npm](#скрипты-npm)
- [Как настроить под свой сервис](#как-настроить-под-свой-сервис)
- [Публикация на сервере](#публикация-на-сервере)
- [Решение проблем](#решение-проблем)
- [Лицензия](#лицензия)

---

## Возможности

- **Главная страница**: hero-блок, статистика, популярные услуги, преимущества, мастера, отзывы, призыв к записи.
- **Услуги и цены**: полный прайс-лист из таблицы `services` (цена «от», длительность, описание).
- **Онлайн-запись**: форма с валидацией на сервере (имя, телефон, автомобиль, дата, комментарий),
  защита от повторной отправки, сохранение заявки в MySQL.
- **Контакты**: адрес, телефоны, режим работы, блок со схемой проезда.
- **Админ-панель** (`/admin`): вход по логину и паролю, список заявок, смена статуса
  (новая → подтверждена → выполнена / отменена), сводная статистика.
- **Демо-режим**: если MySQL ещё не подключена, сайт не падает, а показывает данные из
  `data/demo-data.js` и предупреждает об этом баннером.
- **Безопасность**: параметризованные запросы, пароли в виде scrypt-хешей, сессии в httpOnly-cookie,
  экранирование вывода в EJS.

---

## Требования

| Компонент | Версия | Проверка |
|-----------|--------|----------|
| Node.js | 18 или новее | `node -v` |
| npm | 9+ | `npm -v` |
| MySQL | 8.0+ (или MariaDB 10.4+) | `mysql --version` |

Если MySQL нет — подойдёт любой из вариантов из раздела [Подключение MySQL](#подключение-mysql).

---

## Быстрый старт

### 1. Клонирование

```bash
git clone https://github.com/mmiltevic-ops/testtyuuuu.git autoservice-site
cd autoservice-site
```

Без git можно скачать архив: **Code → Download ZIP** и распаковать.

### 2. Установка зависимостей

```bash
npm install
```

### 3. Запуск сервера MySQL

Убедитесь, что сервер MySQL запущен (служба, XAMPP, OpenServer или Docker — см. ниже).

### 4. Файл `.env`

Скопируйте пример и укажите параметры подключения:

```bash
# Linux / macOS
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Откройте `.env` и заполните:

```env
PORT=3000
SESSION_SECRET=длинная-случайная-строка

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=ваш-пароль
DB_NAME=autoservice

DEMO_FALLBACK=true

ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### 5. Создание базы и демо-данных

```bash
npm run db:init
```

Скрипт создаст базу `autoservice`, таблицы из `database/schema.sql`, наполнит их данными из
`database/seed.sql` и создаст администратора из `ADMIN_USERNAME` / `ADMIN_PASSWORD`.

Ожидаемый вывод:

```
Подключение к MySQL: 127.0.0.1:3306
База «autoservice» готова.
Таблицы созданы (schema.sql).
Демо-данные загружены (seed.sql).
Администратор «admin» создан/обновлён.
Итого: услуг — 8, мастеров — 4, отзывов — 5.
```

### 6. Запуск сайта

```bash
npm start
```

Откройте <http://localhost:3000>. Для разработки с авто-перезапуском: `npm run dev`.

Проверка состояния: <http://localhost:3000/health> → `{"status":"ok","database":"mysql"}`.

---

## Подключение MySQL

### Вариант A. Локальный сервер MySQL

Windows (через winget):

```powershell
winget install Oracle.MySQL
```

Linux (Debian/Ubuntu):

```bash
sudo apt update && sudo apt install mysql-server
sudo service mysql start
```

macOS:

```bash
brew install mysql && brew services start mysql
```

После установки создайте пользователя (по желанию):

```sql
CREATE USER 'autoservice'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON autoservice.* TO 'autoservice'@'localhost';
FLUSH PRIVILEGES;
```

и пропишите его в `.env`.

### Вариант B. XAMPP / OpenServer / Laragon

1. Установите пакет и запустите MySQL из панели управления.
2. Пользователь по умолчанию — `root` без пароля.
3. В `.env`: `DB_USER=root`, `DB_PASSWORD=` (пусто), `DB_PORT=3306`.

### Вариант C. Docker

```bash
docker run -d --name autoservice-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=autoservice \
  -p 3306:3306 \
  mysql:8.0
```

В `.env`: `DB_USER=root`, `DB_PASSWORD=root`, `DB_NAME=autoservice`.

### Вариант D. Без базы (демо-режим)

Ничего настраивать не нужно: при `DEMO_FALLBACK=true` сайт работает на данных из
`data/demo-data.js`, а заявки хранятся в памяти процесса до перезапуска.

---

## Переменные окружения

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `PORT` | `3000` | Порт HTTP-сервера |
| `SESSION_SECRET` | `autoservice-dev-secret` | Секрет сессий, обязательно смените в продакшене |
| `DB_HOST` | `127.0.0.1` | Хост MySQL |
| `DB_PORT` | `3306` | Порт MySQL |
| `DB_USER` | `root` | Пользователь MySQL |
| `DB_PASSWORD` | — | Пароль MySQL |
| `DB_NAME` | `autoservice` | Имя базы данных |
| `DEMO_FALLBACK` | `true` | Показывать демо-данные, если база недоступна |
| `ADMIN_USERNAME` | `admin` | Логин админки (если таблица `admin_users` пуста) |
| `ADMIN_PASSWORD` | `admin123` | Пароль админки |

---

## Админ-панель

- Вход: <http://localhost:3000/admin/login>
- Логин/пароль по умолчанию: `admin` / `admin123`
- После `npm run db:init` администратор хранится в таблице `admin_users` (пароль — scrypt-хеш).
  Значения `ADMIN_USERNAME` / `ADMIN_PASSWORD` из `.env` используются как резерв, если таблица пуста.

**Обязательно смените пароль перед публикацией в интернет:**

1. отредактируйте `.env` (`ADMIN_PASSWORD=новый_пароль`);
2. выполните `npm run db:init` повторно — хеш администратора обновится.

В панели доступны: список заявок (клиент, телефон, авто, услуга, желаемая дата, комментарий),
смена статуса и счётчики по статусам.

---

## Структура проекта

```
├── server.js                 # точка входа: маршруты, сессии, обработка ошибок
├── lib/
│   ├── db.js                 # пул подключений MySQL (mysql2)
│   ├── repo.js               # слой данных + демо-режим
│   └── password.js           # scrypt-хеширование паролей
├── data/
│   └── demo-data.js          # данные для работы без MySQL
├── database/
│   ├── schema.sql            # CREATE TABLE ...
│   └── seed.sql              # демо-услуги, мастера, отзывы
├── scripts/
│   └── init-db.js            # создание базы и наполнение данными
├── views/
│   ├── partials/             # head, header, footer, SVG-иконки
│   ├── index.ejs             # главная
│   ├── services.ejs          # услуги и цены
│   ├── booking.ejs           # форма записи
│   ├── contacts.ejs          # контакты
│   ├── error.ejs             # 404/500
│   └── admin/                # вход и панель заявок
├── public/
│   ├── css/style.css         # стили (тёмная тема, адаптив)
│   ├── js/main.js            # мобильное меню, минимальная дата
│   └── img/favicon.svg
├── .env.example
└── package.json
```

---

## Схема базы данных

| Таблица | Назначение |
|---------|------------|
| `services` | Услуги: название, описание, цена «от», длительность, иконка, порядок, флаг активности |
| `masters` | Мастера: имя, должность, стаж, порядок |
| `reviews` | Отзывы: автор, автомобиль, оценка 1–5, текст, флаг публикации |
| `bookings` | Заявки: услуга, клиент, телефон, авто, желаемая дата, комментарий, статус |
| `admin_users` | Пользователи админки: логин и scrypt-хеш пароля |

Посмотреть данные вручную:

```bash
mysql -u root -p autoservice
SELECT id, client_name, phone, status, created_at FROM bookings ORDER BY created_at DESC;
```

---

## Скрипты npm

| Команда | Действие |
|---------|----------|
| `npm start` | Запуск сервера |
| `npm run dev` | Запуск с авто-перезагрузкой (`node --watch`) |
| `npm run db:init` | Создание базы, таблиц, демо-данных и администратора |

---

## Как настроить под свой сервис

1. **Название, телефон, адрес** — в `views/partials/header.ejs`, `views/partials/footer.ejs`,
   `views/contacts.ejs` и `views/index.ejs`.
2. **Цвета и шрифты** — CSS-переменные в начале `public/css/style.css`
   (`--accent`, `--bg`, `--surface` и т.д.).
3. **Услуги, мастера, отзывы** — правьте `database/seed.sql` и выполняйте `npm run db:init`
   либо меняйте записи прямо в MySQL (`UPDATE services SET price_from = 3000 WHERE id = 1;`).
4. **Тексты преимуществ и отзывов** — в `views/index.ejs`.

---

## Публикация на сервере

Минимальный вариант на Linux-VPS:

```bash
# 1. зависимости и база
npm install --omit=dev
cp .env.example .env && nano .env
npm run db:init

# 2. постоянный процесс
sudo npm i -g pm2
pm2 start server.js --name autoservice
pm2 save && pm2 startup
```

Проксирование через nginx:

```nginx
server {
    listen 80;
    server_name example.ru;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Не забудьте: `SESSION_SECRET`, новый пароль администратора, HTTPS (certbot) и `DEMO_FALLBACK=false`,
чтобы сайт не показывал демо-данные при падении базы.

---

## Решение проблем

**`npm.ps1 cannot be loaded because running scripts is disabled` (Windows PowerShell)**

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

или запускайте команды через `cmd /c "npm install"`.

**`ECONNREFUSED 127.0.0.1:3306`** — сервер MySQL не запущен либо неверные `DB_HOST`/`DB_PORT`.

**`ER_ACCESS_DENIED_ERROR`** — неверные `DB_USER`/`DB_PASSWORD` в `.env`.

**`ER_NOT_SUPPORTED_AUTH_MODE`** — смените плагин аутентификации пользователя:

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'пароль';
FLUSH PRIVILEGES;
```

**Сайт показывает жёлтый баннер «Демо-режим»** — MySQL недоступна. Проверьте `/health`,
запустите `npm run db:init` и перезапустите сервер.

**Порт 3000 занят** — измените `PORT` в `.env`.

**Забыли пароль администратора** — задайте новый в `.env` и выполните `npm run db:init`.

---

## Лицензия

[MIT](LICENSE) — используйте свободно, в том числе в коммерческих проектах.
