-- ==========================================
-- 扩充演示数据 (seed_demo.sql)
-- 幂等设计：可重复执行，靠固定业务编号 + NOT EXISTS 去重
-- 用途：让各业务页面开箱即有丰富、覆盖各种状态的展示数据
-- ==========================================

USE shared_bike_dispatch;

-- ------------------------------------------
-- 1. 调度人员 staffs（补充到约 8 人，覆盖调度员/维修员/主管 + 在岗/休假/离职）
-- ------------------------------------------
INSERT INTO staffs (staff_code, staff_name, phone, district, job_title, staff_status, hired_at)
SELECT t.staff_code, t.staff_name, t.phone, t.district, t.job_title, t.staff_status, t.hired_at
FROM (
  SELECT 'SF002' AS staff_code, '李娜' AS staff_name, '13900139001' AS phone, '中心城区' AS district, 'dispatcher' AS job_title, 'active' AS staff_status, '2025-02-10' AS hired_at UNION ALL
  SELECT 'SF003','王强','13900139002','东部新区','maintainer','active','2025-03-05' UNION ALL
  SELECT 'SF004','赵敏','13900139003','西部片区','maintainer','active','2025-01-20' UNION ALL
  SELECT 'SF005','陈杰','13900139004','南部片区','dispatcher','leave','2024-11-15' UNION ALL
  SELECT 'SF006','刘洋','13900139005','北部新城','dispatcher','active','2025-04-01' UNION ALL
  SELECT 'SF007','孙丽','13900139006','中心城区','manager','active','2024-09-01' UNION ALL
  SELECT 'SF008','周涛','13900139007','东部新区','maintainer','resigned','2024-07-12'
) AS t
WHERE NOT EXISTS (SELECT 1 FROM staffs s WHERE s.staff_code = t.staff_code);

-- ------------------------------------------
-- 2. 用户 users（补充到约 10 人，覆盖学生/VIP 等级、不同余额与账号状态）
--    密码 hash 复用 alice 的（明文 password123），方便统一登录演示
-- ------------------------------------------
INSERT INTO users (rank_id, username, password_hash, phone, real_name, is_verified, balance, credit_score, account_status)
SELECT t.rank_id, t.username, '$2b$10$mbFtRofQy4lUQhoyGpHxZuhX2dMqIo5e2tzgpYfLxie93dmeL55o2',
       t.phone, t.real_name, t.is_verified, t.balance, t.credit_score, t.account_status
FROM (
  SELECT (SELECT id FROM user_ranks WHERE rank_code='STUDENT') AS rank_id, 'diana' AS username, '13800138003' AS phone, '周晓彤' AS real_name, 1 AS is_verified, 35.50 AS balance, 100 AS credit_score, 'active' AS account_status UNION ALL
  SELECT (SELECT id FROM user_ranks WHERE rank_code='STUDENT'), 'evan', '13800138004', '林子轩', 1, 12.00, 95, 'active' UNION ALL
  SELECT (SELECT id FROM user_ranks WHERE rank_code='VIP'), 'fiona', '13800138005', '黄雅琴', 1, 280.00, 100, 'active' UNION ALL
  SELECT (SELECT id FROM user_ranks WHERE rank_code='VIP'), 'george', '13800138006', '吴博文', 1, 156.80, 98, 'active' UNION ALL
  SELECT (SELECT id FROM user_ranks WHERE rank_code='NORMAL'), 'helen', '13800138007', '徐慧敏', 0, 0.00, 70, 'frozen' UNION ALL
  SELECT (SELECT id FROM user_ranks WHERE rank_code='NORMAL'), 'ivan', '13800138008', '马天宇', 1, 48.20, 88, 'active' UNION ALL
  SELECT (SELECT id FROM user_ranks WHERE rank_code='NORMAL'), 'judy', '13800138009', '郭芳菲', 1, 5.00, 60, 'active'
) AS t
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.username = t.username);

-- ------------------------------------------
-- 3. 优惠券 promotion_coupons（补充到约 10 张，覆盖现金/折扣、已用/未用/过期）
-- ------------------------------------------
INSERT INTO promotion_coupons (user_id, coupon_code, coupon_name, coupon_type, face_value, min_spend, expire_at, used_at, is_used, source)
SELECT t.user_id, t.coupon_code, t.coupon_name, t.coupon_type, t.face_value, t.min_spend, t.expire_at, t.used_at, t.is_used, t.source
FROM (
  SELECT (SELECT id FROM users WHERE username='alice') AS user_id, 'CP-NEW-001' AS coupon_code, '新人立减券' AS coupon_name, 'cash' AS coupon_type, 5.00 AS face_value, 0.00 AS min_spend, '2027-12-31 23:59:59' AS expire_at, NULL AS used_at, 0 AS is_used, 'campaign' AS source UNION ALL
  SELECT (SELECT id FROM users WHERE username='bob'), 'CP-WEEK-002', '周末骑行券', 'cash', 3.00, 5.00, '2027-12-31 23:59:59', '2026-05-20 09:30:00', 1, 'campaign' UNION ALL
  SELECT (SELECT id FROM users WHERE username='diana'), 'CP-STU-003', '学生专享折扣', 'discount', 2.00, 0.00, '2027-12-31 23:59:59', NULL, 0, 'system' UNION ALL
  SELECT (SELECT id FROM users WHERE username='fiona'), 'CP-VIP-004', 'VIP 月度礼券', 'cash', 10.00, 0.00, '2027-12-31 23:59:59', NULL, 0, 'system' UNION ALL
  SELECT (SELECT id FROM users WHERE username='george'), 'CP-OLD-005', '过期未使用券', 'cash', 5.00, 0.00, '2025-01-31 23:59:59', NULL, 0, 'campaign' UNION ALL
  SELECT (SELECT id FROM users WHERE username='ivan'), 'CP-USED-006', '已核销满减券', 'cash', 4.00, 10.00, '2027-12-31 23:59:59', '2026-05-28 18:12:00', 1, 'campaign' UNION ALL
  SELECT (SELECT id FROM users WHERE username='judy'), 'CP-INV-007', '邀请好友奖励', 'cash', 8.00, 0.00, '2027-12-31 23:59:59', NULL, 0, 'invite' UNION ALL
  SELECT (SELECT id FROM users WHERE username='evan'), 'CP-STU-008', '开学季折扣券', 'discount', 3.00, 0.00, '2027-12-31 23:59:59', NULL, 0, 'campaign' UNION ALL
  SELECT (SELECT id FROM users WHERE username='charlie'), 'CP-BACK-009', '回归用户券', 'cash', 6.00, 8.00, '2027-12-31 23:59:59', NULL, 0, 'system'
) AS t
WHERE NOT EXISTS (SELECT 1 FROM promotion_coupons c WHERE c.coupon_code = t.coupon_code);

-- ------------------------------------------
-- 4. 订单 orders（补充到约 15 单，覆盖已完成/进行中/已取消，跨多天便于趋势图）
--    actual_amount 为已完成订单的实付金额，进行中/取消为 0
-- ------------------------------------------
INSERT INTO orders (order_no, user_id, equipment_id, start_station_id, end_station_id, start_time, end_time, expected_amount, actual_amount, order_status, remark)
SELECT t.order_no, t.user_id, t.equipment_id, t.start_station_id, t.end_station_id, t.start_time, t.end_time, t.expected_amount, t.actual_amount, t.order_status, t.remark
FROM (
  SELECT 'OD-SEED-001' AS order_no, (SELECT id FROM users WHERE username='alice') AS user_id, (SELECT id FROM equipments WHERE equipment_code='EQ001') AS equipment_id, (SELECT id FROM stations WHERE station_code='DEMO-01') AS start_station_id, (SELECT id FROM stations WHERE station_code='DEMO-03') AS end_station_id, DATE_SUB(NOW(), INTERVAL 6 DAY) AS start_time, DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 18 MINUTE AS end_time, 4.50 AS expected_amount, 4.50 AS actual_amount, 'completed' AS order_status, '演示历史订单' AS remark UNION ALL
  SELECT 'OD-SEED-002', (SELECT id FROM users WHERE username='bob'), (SELECT id FROM equipments WHERE equipment_code='EQ002'), (SELECT id FROM stations WHERE station_code='DEMO-02'), (SELECT id FROM stations WHERE station_code='DEMO-05'), DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 25 MINUTE, 6.00, 6.00, 'completed', '演示历史订单' UNION ALL
  SELECT 'OD-SEED-003', (SELECT id FROM users WHERE username='diana'), (SELECT id FROM equipments WHERE equipment_code='EQ003'), (SELECT id FROM stations WHERE station_code='DEMO-01'), (SELECT id FROM stations WHERE station_code='DEMO-04'), DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 12 MINUTE, 3.20, 2.56, 'completed', '学生折扣订单' UNION ALL
  SELECT 'OD-SEED-004', (SELECT id FROM users WHERE username='fiona'), (SELECT id FROM equipments WHERE equipment_code='EQ004'), (SELECT id FROM stations WHERE station_code='DEMO-02'), (SELECT id FROM stations WHERE station_code='DEMO-06'), DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 30 MINUTE, 7.50, 5.25, 'completed', 'VIP 折扣订单' UNION ALL
  SELECT 'OD-SEED-005', (SELECT id FROM users WHERE username='george'), (SELECT id FROM equipments WHERE equipment_code='EQ001'), (SELECT id FROM stations WHERE station_code='DEMO-03'), (SELECT id FROM stations WHERE station_code='DEMO-07'), DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 8 MINUTE, 2.50, 2.50, 'completed', '演示历史订单' UNION ALL
  SELECT 'OD-SEED-006', (SELECT id FROM users WHERE username='ivan'), (SELECT id FROM equipments WHERE equipment_code='EQ002'), (SELECT id FROM stations WHERE station_code='DEMO-05'), (SELECT id FROM stations WHERE station_code='DEMO-01'), DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 22 MINUTE, 5.50, 5.50, 'completed', '演示历史订单' UNION ALL
  SELECT 'OD-SEED-007', (SELECT id FROM users WHERE username='judy'), (SELECT id FROM equipments WHERE equipment_code='EQ003'), (SELECT id FROM stations WHERE station_code='DEMO-04'), (SELECT id FROM stations WHERE station_code='DEMO-08'), DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 15 MINUTE, 3.80, 3.80, 'completed', '演示历史订单' UNION ALL
  SELECT 'OD-SEED-008', (SELECT id FROM users WHERE username='alice'), (SELECT id FROM equipments WHERE equipment_code='EQ004'), (SELECT id FROM stations WHERE station_code='DEMO-06'), (SELECT id FROM stations WHERE station_code='DEMO-02'), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 19 MINUTE, 4.80, 4.80, 'completed', '演示历史订单' UNION ALL
  SELECT 'OD-SEED-009', (SELECT id FROM users WHERE username='bob'), (SELECT id FROM equipments WHERE equipment_code='EQ001'), (SELECT id FROM stations WHERE station_code='DEMO-07'), (SELECT id FROM stations WHERE station_code='DEMO-03'), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 28 MINUTE, 6.50, 6.50, 'completed', '演示历史订单' UNION ALL
  SELECT 'OD-SEED-010', (SELECT id FROM users WHERE username='evan'), (SELECT id FROM equipments WHERE equipment_code='EQ002'), (SELECT id FROM stations WHERE station_code='DEMO-01'), (SELECT id FROM stations WHERE station_code='DEMO-09'), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 14 MINUTE, 3.50, 2.80, 'completed', '学生折扣订单' UNION ALL
  SELECT 'OD-SEED-011', (SELECT id FROM users WHERE username='fiona'), (SELECT id FROM equipments WHERE equipment_code='EQ003'), (SELECT id FROM stations WHERE station_code='DEMO-02'), (SELECT id FROM stations WHERE station_code='DEMO-04'), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 35 MINUTE, 8.00, 5.60, 'completed', 'VIP 折扣订单' UNION ALL
  SELECT 'OD-SEED-012', (SELECT id FROM users WHERE username='george'), (SELECT id FROM equipments WHERE equipment_code='EQ004'), (SELECT id FROM stations WHERE station_code='DEMO-05'), NULL, NOW() - INTERVAL 40 MINUTE, NULL, 1.50, 0.00, 'active', '进行中订单' UNION ALL
  SELECT 'OD-SEED-013', (SELECT id FROM users WHERE username='ivan'), (SELECT id FROM equipments WHERE equipment_code='EQ001'), (SELECT id FROM stations WHERE station_code='DEMO-03'), NULL, NOW() - INTERVAL 15 MINUTE, NULL, 1.50, 0.00, 'active', '进行中订单' UNION ALL
  SELECT 'OD-SEED-014', (SELECT id FROM users WHERE username='helen'), (SELECT id FROM equipments WHERE equipment_code='EQ002'), (SELECT id FROM stations WHERE station_code='DEMO-06'), NULL, NOW() - INTERVAL 2 DAY, NULL, 1.50, 0.00, 'cancelled', '用户取消订单' UNION ALL
  SELECT 'OD-SEED-015', (SELECT id FROM users WHERE username='judy'), (SELECT id FROM equipments WHERE equipment_code='EQ003'), (SELECT id FROM stations WHERE station_code='DEMO-08'), NULL, NOW() - INTERVAL 6 HOUR, NULL, 1.50, 0.00, 'cancelled', '超时自动取消' AS remark
) AS t
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.order_no = t.order_no);

-- ------------------------------------------
-- 5. 交易流水 transactions（补充约 20 条，覆盖充值 charge / 扣费 fare / 退款 refund）
--    已完成订单对应一条 fare 扣费流水；另有若干充值与退款
-- ------------------------------------------
INSERT INTO transactions (tx_no, user_id, order_id, tx_type, amount, balance_before, balance_after, channel, tx_status, happened_at)
SELECT t.tx_no, t.user_id, t.order_id, t.tx_type, t.amount, t.balance_before, t.balance_after, t.channel, t.tx_status, t.happened_at
FROM (
  -- 充值流水（正向金额）
  SELECT 'TX-SEED-R01' AS tx_no, (SELECT id FROM users WHERE username='alice') AS user_id, NULL AS order_id, 'charge' AS tx_type, 50.00 AS amount, 50.00 AS balance_before, 100.00 AS balance_after, 'alipay' AS channel, 'success' AS tx_status, DATE_SUB(NOW(), INTERVAL 7 DAY) AS happened_at UNION ALL
  SELECT 'TX-SEED-R02', (SELECT id FROM users WHERE username='fiona'), NULL, 'charge', 200.00, 80.00, 280.00, 'wechat', 'success', DATE_SUB(NOW(), INTERVAL 6 DAY) UNION ALL
  SELECT 'TX-SEED-R03', (SELECT id FROM users WHERE username='george'), NULL, 'charge', 100.00, 56.80, 156.80, 'alipay', 'success', DATE_SUB(NOW(), INTERVAL 5 DAY) UNION ALL
  SELECT 'TX-SEED-R04', (SELECT id FROM users WHERE username='bob'), NULL, 'charge', 30.00, 20.00, 50.00, 'wallet', 'success', DATE_SUB(NOW(), INTERVAL 5 DAY) UNION ALL
  SELECT 'TX-SEED-R05', (SELECT id FROM users WHERE username='ivan'), NULL, 'charge', 50.00, -1.80, 48.20, 'wechat', 'success', DATE_SUB(NOW(), INTERVAL 4 DAY) UNION ALL
  SELECT 'TX-SEED-R06', (SELECT id FROM users WHERE username='diana'), NULL, 'charge', 40.00, -4.50, 35.50, 'alipay', 'success', DATE_SUB(NOW(), INTERVAL 4 DAY) UNION ALL
  -- 扣费流水（负向金额，对应已完成订单）
  SELECT 'TX-SEED-F01', (SELECT id FROM users WHERE username='alice'), (SELECT id FROM orders WHERE order_no='OD-SEED-001'), 'fare', -4.50, 100.00, 95.50, 'wallet', 'success', DATE_SUB(NOW(), INTERVAL 6 DAY) UNION ALL
  SELECT 'TX-SEED-F02', (SELECT id FROM users WHERE username='bob'), (SELECT id FROM orders WHERE order_no='OD-SEED-002'), 'fare', -6.00, 50.00, 44.00, 'wallet', 'success', DATE_SUB(NOW(), INTERVAL 5 DAY) UNION ALL
  SELECT 'TX-SEED-F03', (SELECT id FROM users WHERE username='diana'), (SELECT id FROM orders WHERE order_no='OD-SEED-003'), 'fare', -2.56, 35.50, 32.94, 'wallet', 'success', DATE_SUB(NOW(), INTERVAL 5 DAY) UNION ALL
  SELECT 'TX-SEED-F04', (SELECT id FROM users WHERE username='fiona'), (SELECT id FROM orders WHERE order_no='OD-SEED-004'), 'fare', -5.25, 280.00, 274.75, 'wallet', 'success', DATE_SUB(NOW(), INTERVAL 4 DAY) UNION ALL
  SELECT 'TX-SEED-F05', (SELECT id FROM users WHERE username='george'), (SELECT id FROM orders WHERE order_no='OD-SEED-005'), 'fare', -2.50, 156.80, 154.30, 'wallet', 'success', DATE_SUB(NOW(), INTERVAL 4 DAY) UNION ALL
  SELECT 'TX-SEED-F06', (SELECT id FROM users WHERE username='ivan'), (SELECT id FROM orders WHERE order_no='OD-SEED-006'), 'fare', -5.50, 48.20, 42.70, 'wallet', 'success', DATE_SUB(NOW(), INTERVAL 3 DAY) UNION ALL
  SELECT 'TX-SEED-F07', (SELECT id FROM users WHERE username='judy'), (SELECT id FROM orders WHERE order_no='OD-SEED-007'), 'fare', -3.80, 5.00, 1.20, 'wallet', 'success', DATE_SUB(NOW(), INTERVAL 3 DAY) UNION ALL
  SELECT 'TX-SEED-F08', (SELECT id FROM users WHERE username='alice'), (SELECT id FROM orders WHERE order_no='OD-SEED-008'), 'fare', -4.80, 95.50, 90.70, 'wallet', 'success', DATE_SUB(NOW(), INTERVAL 2 DAY) UNION ALL
  SELECT 'TX-SEED-F09', (SELECT id FROM users WHERE username='bob'), (SELECT id FROM orders WHERE order_no='OD-SEED-009'), 'fare', -6.50, 44.00, 37.50, 'wallet', 'success', DATE_SUB(NOW(), INTERVAL 2 DAY) UNION ALL
  SELECT 'TX-SEED-F10', (SELECT id FROM users WHERE username='evan'), (SELECT id FROM orders WHERE order_no='OD-SEED-010'), 'fare', -2.80, 12.00, 9.20, 'wallet', 'success', DATE_SUB(NOW(), INTERVAL 1 DAY) UNION ALL
  SELECT 'TX-SEED-F11', (SELECT id FROM users WHERE username='fiona'), (SELECT id FROM orders WHERE order_no='OD-SEED-011'), 'fare', -5.60, 274.75, 269.15, 'wallet', 'success', DATE_SUB(NOW(), INTERVAL 1 DAY) UNION ALL
  -- 退款流水（正向金额）
  SELECT 'TX-SEED-B01', (SELECT id FROM users WHERE username='helen'), NULL, 'refund', 1.50, 0.00, 1.50, 'wallet', 'success', DATE_SUB(NOW(), INTERVAL 2 DAY) UNION ALL
  SELECT 'TX-SEED-B02', (SELECT id FROM users WHERE username='charlie'), NULL, 'refund', 3.00, 0.00, 3.00, 'wallet', 'success', DATE_SUB(NOW(), INTERVAL 1 DAY)
) AS t
WHERE NOT EXISTS (SELECT 1 FROM transactions x WHERE x.tx_no = t.tx_no);

-- ------------------------------------------
-- 6. 维修记录 maintenance_logs（补充约 7 条，覆盖 reported/processing/done）
--    用存储过程逐条插入：先用变量取出 equipment_id，避免 INSERT 语句直接读 equipments
--    与触发器 trg_after_maintenance_insert（会 UPDATE equipments）冲突；
--    插入后按维修状态修正设备状态：done->idle、processing->maintenance、reported->faulty。
-- ------------------------------------------
DROP PROCEDURE IF EXISTS seed_demo_maintenance;
DELIMITER $$
CREATE PROCEDURE seed_demo_maintenance()
BEGIN
  DECLARE eq BIGINT;
  DECLARE stf BIGINT;

  -- 一条已修复记录的辅助逻辑：插入 + 设备恢复 idle
  -- done #1
  SET eq = (SELECT id FROM equipments WHERE equipment_code='SEED-A000' LIMIT 1);
  SET stf = (SELECT id FROM staffs WHERE staff_code='SF003' LIMIT 1);
  IF eq IS NOT NULL AND NOT EXISTS (SELECT 1 FROM maintenance_logs WHERE equipment_id=eq AND fault_type='brake_fault') THEN
    INSERT INTO maintenance_logs (equipment_id, staff_id, fault_type, fault_description, reported_at, repair_status, handled_at, repair_result)
    VALUES (eq, stf, 'brake_fault', '刹车异响，需更换刹车片', DATE_SUB(NOW(), INTERVAL 3 DAY), 'done', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 40 MINUTE, '已更换刹车片，恢复正常');
    UPDATE equipments SET equipment_status='idle' WHERE id=eq;
  END IF;

  -- done #2
  SET eq = (SELECT id FROM equipments WHERE equipment_code='SEED-A001' LIMIT 1);
  SET stf = (SELECT id FROM staffs WHERE staff_code='SF004' LIMIT 1);
  IF eq IS NOT NULL AND NOT EXISTS (SELECT 1 FROM maintenance_logs WHERE equipment_id=eq AND fault_type='tire_flat') THEN
    INSERT INTO maintenance_logs (equipment_id, staff_id, fault_type, fault_description, reported_at, repair_status, handled_at, repair_result)
    VALUES (eq, stf, 'tire_flat', '轮胎漏气', DATE_SUB(NOW(), INTERVAL 2 DAY), 'done', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 25 MINUTE, '已补胎充气');
    UPDATE equipments SET equipment_status='idle' WHERE id=eq;
  END IF;

  -- processing #1
  SET eq = (SELECT id FROM equipments WHERE equipment_code='SEED-A002' LIMIT 1);
  SET stf = (SELECT id FROM staffs WHERE staff_code='SF003' LIMIT 1);
  IF eq IS NOT NULL AND NOT EXISTS (SELECT 1 FROM maintenance_logs WHERE equipment_id=eq AND fault_type='lock_fault') THEN
    INSERT INTO maintenance_logs (equipment_id, staff_id, fault_type, fault_description, reported_at, repair_status, handled_at, repair_result)
    VALUES (eq, stf, 'lock_fault', '智能锁无法开启', DATE_SUB(NOW(), INTERVAL 1 DAY), 'processing', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 10 MINUTE, NULL);
    UPDATE equipments SET equipment_status='maintenance' WHERE id=eq;
  END IF;

  -- processing #2
  SET eq = (SELECT id FROM equipments WHERE equipment_code='SEED-A003' LIMIT 1);
  SET stf = (SELECT id FROM staffs WHERE staff_code='SF004' LIMIT 1);
  IF eq IS NOT NULL AND NOT EXISTS (SELECT 1 FROM maintenance_logs WHERE equipment_id=eq AND fault_type='battery_low') THEN
    INSERT INTO maintenance_logs (equipment_id, staff_id, fault_type, fault_description, reported_at, repair_status, handled_at, repair_result)
    VALUES (eq, stf, 'battery_low', '电量模块故障', DATE_SUB(NOW(), INTERVAL 1 DAY), 'processing', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 5 MINUTE, NULL);
    UPDATE equipments SET equipment_status='maintenance' WHERE id=eq;
  END IF;

  -- reported #1（保持触发器置的 faulty）
  SET eq = (SELECT id FROM equipments WHERE equipment_code='SEED-B000' LIMIT 1);
  IF eq IS NOT NULL AND NOT EXISTS (SELECT 1 FROM maintenance_logs WHERE equipment_id=eq AND fault_type='vehicle_fault') THEN
    INSERT INTO maintenance_logs (equipment_id, staff_id, fault_type, fault_description, reported_at, repair_status, handled_at, repair_result)
    VALUES (eq, NULL, 'vehicle_fault', '车身损坏，待派工', DATE_SUB(NOW(), INTERVAL 8 HOUR), 'reported', NULL, NULL);
  END IF;

  -- reported #2
  SET eq = (SELECT id FROM equipments WHERE equipment_code='SEED-B001' LIMIT 1);
  IF eq IS NOT NULL AND NOT EXISTS (SELECT 1 FROM maintenance_logs WHERE equipment_id=eq AND fault_type='lock_fault') THEN
    INSERT INTO maintenance_logs (equipment_id, staff_id, fault_type, fault_description, reported_at, repair_status, handled_at, repair_result)
    VALUES (eq, NULL, 'lock_fault', '锁具卡死', DATE_SUB(NOW(), INTERVAL 5 HOUR), 'reported', NULL, NULL);
  END IF;

  -- reported #3
  SET eq = (SELECT id FROM equipments WHERE equipment_code='SEED-B002' LIMIT 1);
  IF eq IS NOT NULL AND NOT EXISTS (SELECT 1 FROM maintenance_logs WHERE equipment_id=eq AND fault_type='brake_fault') THEN
    INSERT INTO maintenance_logs (equipment_id, staff_id, fault_type, fault_description, reported_at, repair_status, handled_at, repair_result)
    VALUES (eq, NULL, 'brake_fault', '刹车失灵', DATE_SUB(NOW(), INTERVAL 2 HOUR), 'reported', NULL, NULL);
  END IF;
END$$
DELIMITER ;

CALL seed_demo_maintenance();
DROP PROCEDURE seed_demo_maintenance;

-- ------------------------------------------
-- 7. 调度工单 dispatch_tasks（补充约 6 条，覆盖 pending/doing/done）
-- ------------------------------------------
INSERT INTO dispatch_tasks (task_no, staff_id, from_station_id, to_station_id, equipment_ids, task_type, planned_at, started_at, finished_at, task_status, remark)
SELECT t.task_no, t.staff_id, t.from_station_id, t.to_station_id, t.equipment_ids, t.task_type, t.planned_at, t.started_at, t.finished_at, t.task_status, t.remark
FROM (
  SELECT 'DT-SEED-001' AS task_no, (SELECT id FROM staffs WHERE staff_code='SF002') AS staff_id, (SELECT id FROM stations WHERE station_code='DEMO-01') AS from_station_id, (SELECT id FROM stations WHERE station_code='DEMO-07') AS to_station_id, JSON_ARRAY((SELECT id FROM equipments WHERE equipment_code='SEED-A010'),(SELECT id FROM equipments WHERE equipment_code='SEED-A011')) AS equipment_ids, 'relocation' AS task_type, DATE_SUB(NOW(), INTERVAL 3 DAY) AS planned_at, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 20 MINUTE AS started_at, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 90 MINUTE AS finished_at, 'done' AS task_status, '已完成调拨' AS remark UNION ALL
  SELECT 'DT-SEED-002', (SELECT id FROM staffs WHERE staff_code='SF006'), (SELECT id FROM stations WHERE station_code='DEMO-02'), (SELECT id FROM stations WHERE station_code='DEMO-08'), JSON_ARRAY((SELECT id FROM equipments WHERE equipment_code='SEED-B010'),(SELECT id FROM equipments WHERE equipment_code='SEED-B011'),(SELECT id FROM equipments WHERE equipment_code='SEED-B012')), 'relocation', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 15 MINUTE, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 75 MINUTE, 'done', '已完成调拨' UNION ALL
  SELECT 'DT-SEED-003', (SELECT id FROM staffs WHERE staff_code='SF002'), (SELECT id FROM stations WHERE station_code='DEMO-01'), (SELECT id FROM stations WHERE station_code='DEMO-09'), JSON_ARRAY((SELECT id FROM equipments WHERE equipment_code='SEED-A012')), 'relocation', DATE_SUB(NOW(), INTERVAL 4 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR), NULL, 'doing', '调拨进行中' UNION ALL
  SELECT 'DT-SEED-004', (SELECT id FROM staffs WHERE staff_code='SF006'), (SELECT id FROM stations WHERE station_code='DEMO-02'), (SELECT id FROM stations WHERE station_code='DEMO-10'), JSON_ARRAY((SELECT id FROM equipments WHERE equipment_code='SEED-B013'),(SELECT id FROM equipments WHERE equipment_code='SEED-B014')), 'relocation', DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR), NULL, 'doing', '调拨进行中' UNION ALL
  SELECT 'DT-SEED-005', (SELECT id FROM staffs WHERE staff_code='SF002'), (SELECT id FROM stations WHERE station_code='DEMO-01'), (SELECT id FROM stations WHERE station_code='DEMO-05'), JSON_ARRAY((SELECT id FROM equipments WHERE equipment_code='SEED-A013')), 'relocation', NOW() + INTERVAL 1 HOUR, NULL, NULL, 'pending', '待派单' UNION ALL
  SELECT 'DT-SEED-006', (SELECT id FROM staffs WHERE staff_code='SF006'), (SELECT id FROM stations WHERE station_code='DEMO-02'), (SELECT id FROM stations WHERE station_code='DEMO-06'), JSON_ARRAY((SELECT id FROM equipments WHERE equipment_code='SEED-B015')), 'relocation', NOW() + INTERVAL 2 HOUR, NULL, NULL, 'pending', '待派单' AS remark
) AS t
WHERE NOT EXISTS (SELECT 1 FROM dispatch_tasks d WHERE d.task_no = t.task_no);

-- 完成提示
SELECT '演示数据扩充完成' AS info;
