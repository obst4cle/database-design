CREATE DATABASE IF NOT EXISTS shared_bike_dispatch
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE shared_bike_dispatch;

CREATE TABLE IF NOT EXISTS user_ranks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  rank_code VARCHAR(32) NOT NULL UNIQUE,
  rank_name VARCHAR(50) NOT NULL,
  discount_rate DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  description VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  rank_id BIGINT NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  real_name VARCHAR(50) DEFAULT NULL,
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  credit_score INT NOT NULL DEFAULT 100,
  account_status VARCHAR(20) NOT NULL DEFAULT 'active',
  last_login_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_rank FOREIGN KEY (rank_id) REFERENCES user_ranks(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_users_phone (phone),
  INDEX idx_users_rank_id (rank_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS stations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  station_code VARCHAR(32) NOT NULL UNIQUE,
  station_name VARCHAR(100) NOT NULL,
  address VARCHAR(255) DEFAULT NULL,
  location POINT NOT NULL,
  max_capacity INT NOT NULL DEFAULT 0,
  available_slots INT NOT NULL DEFAULT 0,
  station_status VARCHAR(20) NOT NULL DEFAULT 'normal',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  SPATIAL INDEX idx_stations_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS equipments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  station_id BIGINT DEFAULT NULL,
  equipment_code VARCHAR(32) NOT NULL UNIQUE,
  equipment_type VARCHAR(30) NOT NULL,
  battery_level TINYINT UNSIGNED NOT NULL DEFAULT 100,
  hardware_version VARCHAR(30) NOT NULL,
  equipment_status VARCHAR(20) NOT NULL DEFAULT 'idle',
  last_maintenance_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_equipments_station FOREIGN KEY (station_id) REFERENCES stations(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_equipments_station_id (station_id),
  INDEX idx_equipments_status (equipment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS staffs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  staff_code VARCHAR(32) NOT NULL UNIQUE,
  staff_name VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  district VARCHAR(100) NOT NULL,
  job_title VARCHAR(50) NOT NULL DEFAULT 'dispatcher',
  staff_status VARCHAR(20) NOT NULL DEFAULT 'active',
  hired_at DATE DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  equipment_id BIGINT NOT NULL,
  staff_id BIGINT DEFAULT NULL,
  fault_type VARCHAR(50) NOT NULL,
  fault_description VARCHAR(500) DEFAULT NULL,
  reported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  repair_status VARCHAR(20) NOT NULL DEFAULT 'reported',
  handled_at DATETIME DEFAULT NULL,
  repair_result VARCHAR(500) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_maintenance_equipment FOREIGN KEY (equipment_id) REFERENCES equipments(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_maintenance_staff FOREIGN KEY (staff_id) REFERENCES staffs(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_maintenance_equipment_id (equipment_id),
  INDEX idx_maintenance_staff_id (staff_id),
  INDEX idx_maintenance_status (repair_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS promotion_coupons (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  order_id BIGINT DEFAULT NULL,
  coupon_code VARCHAR(32) NOT NULL UNIQUE,
  coupon_name VARCHAR(80) NOT NULL,
  coupon_type VARCHAR(30) NOT NULL,
  face_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  min_spend DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  expire_at DATETIME NOT NULL,
  used_at DATETIME DEFAULT NULL,
  is_used TINYINT(1) NOT NULL DEFAULT 0,
  source VARCHAR(50) NOT NULL DEFAULT 'system',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_coupons_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_coupons_user_id (user_id),
  INDEX idx_coupons_expire_at (expire_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(40) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  equipment_id BIGINT NOT NULL,
  start_station_id BIGINT NOT NULL,
  end_station_id BIGINT DEFAULT NULL,
  coupon_id BIGINT DEFAULT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME DEFAULT NULL,
  expected_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  actual_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  order_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  remark VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_orders_equipment FOREIGN KEY (equipment_id) REFERENCES equipments(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_orders_start_station FOREIGN KEY (start_station_id) REFERENCES stations(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_orders_end_station FOREIGN KEY (end_station_id) REFERENCES stations(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES promotion_coupons(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_orders_user_id (user_id),
  INDEX idx_orders_equipment_id (equipment_id),
  INDEX idx_orders_start_time (start_time),
  INDEX idx_orders_status (order_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS transactions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tx_no VARCHAR(40) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  order_id BIGINT DEFAULT NULL,
  tx_type VARCHAR(30) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  balance_before DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  balance_after DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  channel VARCHAR(30) NOT NULL DEFAULT 'wallet',
  tx_status VARCHAR(20) NOT NULL DEFAULT 'success',
  happened_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_transactions_order FOREIGN KEY (order_id) REFERENCES orders(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_transactions_user_id (user_id),
  INDEX idx_transactions_order_id (order_id),
  INDEX idx_transactions_happened_at (happened_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE promotion_coupons
  ADD INDEX idx_coupons_order_id (order_id),
  ADD CONSTRAINT fk_coupons_order FOREIGN KEY (order_id) REFERENCES orders(id)
    ON UPDATE CASCADE ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS dispatch_tasks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  task_no VARCHAR(40) NOT NULL UNIQUE,
  staff_id BIGINT NOT NULL,
  from_station_id BIGINT NOT NULL,
  to_station_id BIGINT NOT NULL,
  equipment_ids JSON NOT NULL,
  task_type VARCHAR(30) NOT NULL DEFAULT 'relocation',
  planned_at DATETIME NOT NULL,
  started_at DATETIME DEFAULT NULL,
  finished_at DATETIME DEFAULT NULL,
  task_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  remark VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_dispatch_staff FOREIGN KEY (staff_id) REFERENCES staffs(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_dispatch_from_station FOREIGN KEY (from_station_id) REFERENCES stations(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_dispatch_to_station FOREIGN KEY (to_station_id) REFERENCES stations(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_dispatch_staff_id (staff_id),
  INDEX idx_dispatch_from_station_id (from_station_id),
  INDEX idx_dispatch_to_station_id (to_station_id),
  INDEX idx_dispatch_task_status (task_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO user_ranks (rank_code, rank_name, discount_rate, deposit_amount, description)
VALUES
  ('NORMAL', '普通会员', 1.00, 20.00, '基础计费'),
  ('STUDENT', '学生会员', 0.80, 10.00, '享受八折'),
  ('VIP', '黑金会员', 0.70, 0.00, '免押金')
ON DUPLICATE KEY UPDATE rank_name = VALUES(rank_name);
