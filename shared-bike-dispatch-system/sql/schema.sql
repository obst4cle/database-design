CREATE DATABASE IF NOT EXISTS shared_bike_dispatch
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE shared_bike_dispatch;

CREATE TABLE user_ranks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  rank_code VARCHAR(32) NOT NULL UNIQUE,
  rank_name VARCHAR(50) NOT NULL,
  discount_rate DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  description VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE users (
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

CREATE TABLE stations (
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

CREATE TABLE equipments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  station_id BIGINT DEFAULT NULL,
  equipment_code VARCHAR(32) NOT NULL UNIQUE,
  equipment_type VARCHAR(30) NOT NULL,
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

CREATE TABLE staffs (
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

CREATE TABLE maintenance_logs (
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

CREATE TABLE promotion_coupons (
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

CREATE TABLE orders (
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

CREATE TABLE transactions (
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

CREATE TABLE dispatch_tasks (
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

CREATE TRIGGER trg_after_maintenance_insert
AFTER INSERT ON maintenance_logs
FOR EACH ROW
UPDATE equipments
SET equipment_status = 'faulty'
WHERE id = NEW.equipment_id;

INSERT INTO user_ranks (rank_code, rank_name, discount_rate, deposit_amount, description)
VALUES
  ('NORMAL', '普通会员', 1.00, 20.00, '基础计费'),
  ('STUDENT', '学生会员', 0.80, 10.00, '享受八折'),
  ('VIP', '黑金会员', 0.70, 0.00, '免押金');

-- ==========================================
-- 以下为初始化测试数据 (方便一键启动项目)
-- ==========================================

-- 1. 初始化测试用户 (密码统一为明文 123456 的 hash值)
INSERT INTO users (rank_id, username, password_hash, phone, real_name, is_verified, balance) 
VALUES 
  ((SELECT id FROM user_ranks WHERE rank_code = 'NORMAL' LIMIT 1), 'alice', '$2b$10$mbFtRofQy4lUQhoyGpHxZuhX2dMqIo5e2tzgpYfLxie93dmeL55o2', '13800138000', 'Alice', 1, 100.00),
  ((SELECT id FROM user_ranks WHERE rank_code = 'NORMAL' LIMIT 1), 'bob', '$2b$10$XnvLPxOK3XwmtWSA1VHQ6.jh.rocCGzNLRFHJGEzzpptWTQlbalNi', '13800138001', 'Bob', 1, 50.00),
  ((SELECT id FROM user_ranks WHERE rank_code = 'NORMAL' LIMIT 1), 'charlie', '$2b$10$LfB64PAIOIvR3RxCPKTvsext1WNGlG5d6NI9uzEy9QWj2r0YaD8Q6', '13800138002', 'Charlie', 1, 0.00);

-- 1.1 初始化测试优惠券
INSERT INTO promotion_coupons (user_id, coupon_code, coupon_name, coupon_type, face_value, min_spend, expire_at, used_at, is_used, source)
VALUES
  ((SELECT id FROM users WHERE username = 'alice' LIMIT 1), 'CP-DEMO-BASE', '基础演示优惠券', 'cash', 3.00, 0.00, '2027-12-31 23:59:59', NULL, 0, 'demo');

-- 2. 初始化测试站点
INSERT INTO stations (station_code, station_name, address, location, max_capacity, available_slots) 
VALUES 
  ('DEMO-01', '演示站点 1', '演示路 1 号', ST_GeomFromText('POINT(121.4701 31.2301)'), 24, 6),
  ('DEMO-02', '演示站点 2', '演示路 2 号', ST_GeomFromText('POINT(121.4712 31.2312)'), 24, 6),
  ('DEMO-03', '演示站点 3', '演示路 3 号', ST_GeomFromText('POINT(121.4723 31.2323)'), 24, 6),
  ('DEMO-04', '演示站点 4', '演示路 4 号', ST_GeomFromText('POINT(121.4734 31.2334)'), 24, 6),
  ('DEMO-05', '演示站点 5', '演示路 5 号', ST_GeomFromText('POINT(121.4745 31.2345)'), 24, 6),
  ('DEMO-06', '演示站点 6', '演示路 6 号', ST_GeomFromText('POINT(121.4756 31.2356)'), 24, 6),
  ('DEMO-07', '演示站点 7', '演示路 7 号', ST_GeomFromText('POINT(121.4767 31.2367)'), 24, 6),
  ('DEMO-08', '演示站点 8', '演示路 8 号', ST_GeomFromText('POINT(121.4778 31.2378)'), 24, 6),
  ('DEMO-09', '演示站点 9', '演示路 9 号', ST_GeomFromText('POINT(121.4789 31.2389)'), 24, 6),
  ('DEMO-10', '演示站点 10', '演示路 10 号', ST_GeomFromText('POINT(121.4801 31.2401)'), 24, 6);

-- 3. 初始化测试单车
INSERT INTO equipments (station_id, equipment_code, equipment_type, hardware_version, equipment_status) 
VALUES 
  ((SELECT id FROM stations WHERE station_code = 'DEMO-01'), 'EQ001', 'bike', 'v1', 'idle'),
  ((SELECT id FROM stations WHERE station_code = 'DEMO-01'), 'EQ002', 'bike', 'v1', 'idle'),
  ((SELECT id FROM stations WHERE station_code = 'DEMO-01'), 'EQ003', 'bike', 'v1', 'idle'),
  ((SELECT id FROM stations WHERE station_code = 'DEMO-02'), 'EQ004', 'bike', 'v1', 'idle');

-- 4. 初始化工作人员
INSERT INTO staffs (staff_code, staff_name, phone, district, job_title, staff_status, hired_at)
VALUES
  ('SF001', '调度员张伟', '13900139000', '中心城区', 'dispatcher', 'active', '2025-01-01');

-- 4.1 初始化一条调度工单演示记录
INSERT INTO dispatch_tasks (task_no, staff_id, from_station_id, to_station_id, equipment_ids, task_type, planned_at, task_status, remark)
VALUES (
  'DT-DEMO-001',
  (SELECT id FROM staffs WHERE staff_code = 'SF001' LIMIT 1),
  (SELECT id FROM stations WHERE station_code = 'DEMO-01' LIMIT 1),
  (SELECT id FROM stations WHERE station_code = 'DEMO-02' LIMIT 1),
  JSON_ARRAY((SELECT id FROM equipments WHERE equipment_code = 'EQ001' LIMIT 1)),
  'relocation',
  NOW(),
  'pending',
  '基础演示调度工单'
);

-- 5. 初始化一条维修演示记录，插入后触发器会把 EQ004 状态置为 faulty
SET @demo_fault_equipment_id = (SELECT id FROM equipments WHERE equipment_code = 'EQ004' LIMIT 1);
SET @demo_staff_id = (SELECT id FROM staffs WHERE staff_code = 'SF001' LIMIT 1);

INSERT INTO maintenance_logs (equipment_id, staff_id, fault_type, repair_status, repair_result)
SELECT @demo_fault_equipment_id, @demo_staff_id, 'vehicle_fault', 'reported', '待处理'
WHERE @demo_fault_equipment_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM maintenance_logs m
    WHERE m.equipment_id = @demo_fault_equipment_id
      AND m.fault_type = 'vehicle_fault'
      AND m.repair_status = 'reported'
  );

UPDATE equipments
SET equipment_status = 'faulty'
WHERE id = @demo_fault_equipment_id;
