-- Схема базы данных автосервиса
-- Применяется скриптом: npm run db:init
-- (база данных создаётся отдельно, см. scripts/init-db.js)

CREATE TABLE IF NOT EXISTS services (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title         VARCHAR(120) NOT NULL,
  description   TEXT NOT NULL,
  price_from    DECIMAL(10, 2) NOT NULL DEFAULT 0,
  duration_min  SMALLINT UNSIGNED NOT NULL DEFAULT 60,
  icon          VARCHAR(32) NOT NULL DEFAULT 'wrench',
  sort_order    INT NOT NULL DEFAULT 0,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_services_active (is_active, sort_order)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS masters (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name             VARCHAR(80) NOT NULL,
  position         VARCHAR(80) NOT NULL,
  experience_years TINYINT UNSIGNED NOT NULL DEFAULT 1,
  photo_url        VARCHAR(255) DEFAULT NULL,
  sort_order       INT NOT NULL DEFAULT 0,
  is_active        TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  author       VARCHAR(80) NOT NULL,
  car          VARCHAR(80) NOT NULL,
  rating       TINYINT UNSIGNED NOT NULL DEFAULT 5,
  text         TEXT NOT NULL,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_reviews_published (is_published, created_at),
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bookings (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  service_id     INT UNSIGNED DEFAULT NULL,
  client_name    VARCHAR(60) NOT NULL,
  phone          VARCHAR(20) NOT NULL,
  car_model      VARCHAR(80) DEFAULT NULL,
  preferred_date DATE DEFAULT NULL,
  comment        TEXT DEFAULT NULL,
  status         ENUM('new', 'confirmed', 'done', 'cancelled') NOT NULL DEFAULT 'new',
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bookings_status (status),
  KEY idx_bookings_created (created_at),
  CONSTRAINT fk_bookings_service FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(40) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_username (username)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
