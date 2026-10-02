-- ============================================================
-- TABLEPULSE AI — Database Schema
-- Version: 1.0  (Stage 4 Approved)
-- Engine:  InnoDB
-- Charset: utf8mb4
-- ============================================================

-- Create and select the database
CREATE DATABASE IF NOT EXISTS `tablepulse_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `tablepulse_db`;

-- ============================================================
-- TABLE 1: users
-- Stores all users: customers, owners, admins
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`            BIGINT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(100)       NOT NULL,
  `email`         VARCHAR(255)       NOT NULL,
  `password_hash` VARCHAR(255)       NOT NULL,
  `phone`         VARCHAR(20)        DEFAULT NULL,
  `role`          ENUM('customer','owner','admin') NOT NULL DEFAULT 'customer',
  `is_active`     TINYINT(1)         NOT NULL DEFAULT 1,
  `created_at`    DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 2: restaurants
-- ============================================================
CREATE TABLE IF NOT EXISTS `restaurants` (
  `id`                         BIGINT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `owner_id`                   BIGINT UNSIGNED    NOT NULL,
  `name`                       VARCHAR(150)       NOT NULL,
  `slug`                       VARCHAR(180)       NOT NULL,
  `description`                TEXT               DEFAULT NULL,
  `cuisine_type`               VARCHAR(80)        DEFAULT NULL,
  `address`                    VARCHAR(500)       NOT NULL,
  `latitude`                   DECIMAL(10,8)      DEFAULT NULL,
  `longitude`                  DECIMAL(11,8)      DEFAULT NULL,
  `phone`                      VARCHAR(20)        DEFAULT NULL,
  `cover_photo_url`            VARCHAR(500)       DEFAULT NULL,
  `avg_dining_duration_mins`   SMALLINT UNSIGNED  NOT NULL DEFAULT 45,
  `avg_cleaning_duration_mins` SMALLINT UNSIGNED  NOT NULL DEFAULT 10,
  `tax_rate`                   DECIMAL(5,2)       NOT NULL DEFAULT 5.00,
  `approval_status`            ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `is_active`                  TINYINT(1)         NOT NULL DEFAULT 0,
  `rejection_reason`           TEXT               DEFAULT NULL,
  `created_at`                 DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`                 DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_restaurants_owner_id` (`owner_id`),
  UNIQUE KEY `uq_restaurants_slug` (`slug`),
  KEY `idx_restaurants_approval` (`approval_status`),
  KEY `idx_restaurants_active` (`is_active`),
  KEY `idx_restaurants_location` (`latitude`, `longitude`),
  CONSTRAINT `fk_restaurants_owner`
    FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 3: restaurant_hours
-- ============================================================
CREATE TABLE IF NOT EXISTS `restaurant_hours` (
  `id`            BIGINT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `restaurant_id` BIGINT UNSIGNED    NOT NULL,
  `day_of_week`   TINYINT UNSIGNED   NOT NULL COMMENT '0=Sun 1=Mon ... 6=Sat',
  `open_time`     TIME               DEFAULT NULL,
  `close_time`    TIME               DEFAULT NULL,
  `is_closed`     TINYINT(1)         NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_hours_restaurant_day` (`restaurant_id`, `day_of_week`),
  CONSTRAINT `fk_hours_restaurant`
    FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 4: tables
-- ============================================================
CREATE TABLE IF NOT EXISTS `tables` (
  `id`                BIGINT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `restaurant_id`     BIGINT UNSIGNED    NOT NULL,
  `table_number`      VARCHAR(20)        NOT NULL,
  `capacity`          TINYINT UNSIGNED   NOT NULL,
  `status`            ENUM('available','reserved','occupied','cleaning') NOT NULL DEFAULT 'available',
  `qr_token`          VARCHAR(36)        NOT NULL COMMENT 'UUID v4',
  `status_changed_at` DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `occupied_since`    DATETIME           DEFAULT NULL,
  `display_order`     SMALLINT UNSIGNED  NOT NULL DEFAULT 0,
  `created_at`        DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tables_qr_token` (`qr_token`),
  UNIQUE KEY `uq_tables_number_restaurant` (`restaurant_id`, `table_number`),
  KEY `idx_tables_status` (`restaurant_id`, `status`),
  CONSTRAINT `fk_tables_restaurant`
    FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 5: reservations
-- ============================================================
CREATE TABLE IF NOT EXISTS `reservations` (
  `id`               BIGINT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `customer_id`      BIGINT UNSIGNED    NOT NULL,
  `restaurant_id`    BIGINT UNSIGNED    NOT NULL,
  `table_id`         BIGINT UNSIGNED    DEFAULT NULL,
  `reservation_date` DATE               NOT NULL,
  `reservation_time` TIME               NOT NULL,
  `party_size`       TINYINT UNSIGNED   NOT NULL,
  `status`           ENUM('pending','confirmed','rejected','cancelled','no_show','completed') NOT NULL DEFAULT 'pending',
  `special_note`     VARCHAR(500)       DEFAULT NULL,
  `rejection_reason` VARCHAR(500)       DEFAULT NULL,
  `expires_at`       DATETIME           NOT NULL,
  `created_at`       DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reservations_customer` (`customer_id`),
  KEY `idx_reservations_restaurant` (`restaurant_id`),
  KEY `idx_reservations_date_time` (`restaurant_id`, `reservation_date`, `reservation_time`),
  KEY `idx_reservations_status` (`restaurant_id`, `status`),
  CONSTRAINT `fk_reservations_customer`
    FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_reservations_restaurant`
    FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_reservations_table`
    FOREIGN KEY (`table_id`) REFERENCES `tables` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 6: walk_in_queue
-- ============================================================
CREATE TABLE IF NOT EXISTS `walk_in_queue` (
  `id`             BIGINT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `customer_id`    BIGINT UNSIGNED    NOT NULL,
  `restaurant_id`  BIGINT UNSIGNED    NOT NULL,
  `party_size`     TINYINT UNSIGNED   NOT NULL,
  `queue_position` SMALLINT UNSIGNED  NOT NULL,
  `status`         ENUM('waiting','called','seated','cancelled','expired') NOT NULL DEFAULT 'waiting',
  `joined_at`      DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `called_at`      DATETIME           DEFAULT NULL,
  `expires_at`     DATETIME           DEFAULT NULL,
  `completed_at`   DATETIME           DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_queue_restaurant_status` (`restaurant_id`, `status`),
  KEY `idx_queue_customer` (`customer_id`),
  CONSTRAINT `fk_queue_customer`
    FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_queue_restaurant`
    FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 7: menu_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS `menu_categories` (
  `id`            BIGINT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `restaurant_id` BIGINT UNSIGNED    NOT NULL,
  `name`          VARCHAR(100)       NOT NULL,
  `display_order` SMALLINT UNSIGNED  NOT NULL DEFAULT 0,
  `created_at`    DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_menu_categories_restaurant` (`restaurant_id`),
  CONSTRAINT `fk_menu_categories_restaurant`
    FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 8: menu_items
-- ============================================================
CREATE TABLE IF NOT EXISTS `menu_items` (
  `id`            BIGINT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `restaurant_id` BIGINT UNSIGNED    NOT NULL,
  `category_id`   BIGINT UNSIGNED    NOT NULL,
  `name`          VARCHAR(150)       NOT NULL,
  `description`   TEXT               DEFAULT NULL,
  `price`         DECIMAL(10,2)      NOT NULL,
  `is_vegetarian` TINYINT(1)         NOT NULL DEFAULT 0,
  `photo_url`     VARCHAR(500)       DEFAULT NULL,
  `is_available`  TINYINT(1)         NOT NULL DEFAULT 1,
  `display_order` SMALLINT UNSIGNED  NOT NULL DEFAULT 0,
  `created_at`    DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_menu_items_restaurant` (`restaurant_id`),
  KEY `idx_menu_items_category` (`category_id`),
  KEY `idx_menu_items_available` (`restaurant_id`, `is_available`),
  CONSTRAINT `fk_menu_items_restaurant`
    FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_menu_items_category`
    FOREIGN KEY (`category_id`) REFERENCES `menu_categories` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 9: orders
-- ============================================================
CREATE TABLE IF NOT EXISTS `orders` (
  `id`            BIGINT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `customer_id`   BIGINT UNSIGNED    NOT NULL,
  `restaurant_id` BIGINT UNSIGNED    NOT NULL,
  `table_id`      BIGINT UNSIGNED    NOT NULL,
  `status`        ENUM('received','preparing','served','completed','cancelled') NOT NULL DEFAULT 'received',
  `special_note`  VARCHAR(500)       DEFAULT NULL,
  `created_at`    DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_orders_customer` (`customer_id`),
  KEY `idx_orders_restaurant_table` (`restaurant_id`, `table_id`),
  KEY `idx_orders_status` (`restaurant_id`, `status`),
  CONSTRAINT `fk_orders_customer`
    FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_orders_restaurant`
    FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_orders_table`
    FOREIGN KEY (`table_id`) REFERENCES `tables` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 10: order_items
-- ============================================================
CREATE TABLE IF NOT EXISTS `order_items` (
  `id`           BIGINT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `order_id`     BIGINT UNSIGNED    NOT NULL,
  `menu_item_id` BIGINT UNSIGNED    DEFAULT NULL COMMENT 'nullable — item may be deleted later',
  `item_name`    VARCHAR(150)       NOT NULL    COMMENT 'snapshot at order time',
  `unit_price`   DECIMAL(10,2)      NOT NULL    COMMENT 'snapshot at order time',
  `quantity`     TINYINT UNSIGNED   NOT NULL DEFAULT 1,
  `created_at`   DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order` (`order_id`),
  CONSTRAINT `fk_order_items_order`
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_menu_item`
    FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 11: payments
-- ============================================================
CREATE TABLE IF NOT EXISTS `payments` (
  `id`             BIGINT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `order_id`       BIGINT UNSIGNED    NOT NULL,
  `subtotal`       DECIMAL(10,2)      NOT NULL,
  `tax_rate`       DECIMAL(5,2)       NOT NULL,
  `tax_amount`     DECIMAL(10,2)      NOT NULL,
  `total_amount`   DECIMAL(10,2)      NOT NULL,
  `status`         ENUM('pending','paid','refunded') NOT NULL DEFAULT 'pending',
  `payment_method` VARCHAR(50)        NOT NULL DEFAULT 'simulated',
  `paid_at`        DATETIME           DEFAULT NULL,
  `created_at`     DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payments_order_id` (`order_id`),
  CONSTRAINT `fk_payments_order`
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 12: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`             BIGINT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `user_id`        BIGINT UNSIGNED    NOT NULL,
  `title`          VARCHAR(150)       NOT NULL,
  `message`        TEXT               NOT NULL,
  `type`           VARCHAR(50)        NOT NULL,
  `reference_id`   BIGINT UNSIGNED    DEFAULT NULL,
  `reference_type` VARCHAR(50)        DEFAULT NULL,
  `is_read`        TINYINT(1)         NOT NULL DEFAULT 0,
  `created_at`     DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user` (`user_id`, `is_read`),
  KEY `idx_notifications_created` (`user_id`, `created_at`),
  CONSTRAINT `fk_notifications_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Schema complete — 12 tables created
-- ============================================================
