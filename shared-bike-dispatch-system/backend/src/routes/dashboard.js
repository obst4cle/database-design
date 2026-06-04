import express from 'express'

const router = express.Router()

router.get('/summary', async (req, res, next) => {
  try {
    const [users, stations, equipments, orders, coupons, tasks, faults] = await Promise.all([
      req.app.locals.db.query(`SELECT COUNT(*) AS total FROM users`),
      req.app.locals.db.query(`SELECT COUNT(*) AS total FROM stations`),
      req.app.locals.db.query(`SELECT COUNT(*) AS total FROM equipments`),
      req.app.locals.db.query(`SELECT COUNT(*) AS total FROM orders`),
      req.app.locals.db.query(`SELECT COUNT(*) AS total FROM promotion_coupons WHERE is_used = 1`),
      req.app.locals.db.query(`SELECT COUNT(*) AS total FROM dispatch_tasks`),
      req.app.locals.db.query(`SELECT COUNT(*) AS total FROM maintenance_logs WHERE repair_status <> 'done'`)
    ])

    res.json({
      code: 0,
      message: 'success',
      data: {
        userTotal: users[0].total,
        stationTotal: stations[0].total,
        equipmentTotal: equipments[0].total,
        orderTotal: orders[0].total,
        couponUsedTotal: coupons[0].total,
        taskTotal: tasks[0].total,
        faultPendingTotal: faults[0].total
      }
    })
  } catch (error) {
    next(error)
  }
})

// 使用情况统计：4 个维度，全部基于现有表聚合
router.get('/analytics', async (req, res, next) => {
  try {
    const db = req.app.locals.db

    const [
      equipmentStatus,
      stationLoad,
      revenueTrend,
      maintenanceEfficiency,
      dispatchEfficiency
    ] = await Promise.all([
      // 1. 车辆运营状态分布
      db.query(`SELECT equipment_status AS status, COUNT(*) AS total FROM equipments GROUP BY equipment_status`),

      // 2. 站点忙闲/失衡榜：当前停靠车辆数 vs 容量
      db.query(`
        SELECT
          s.id,
          s.station_name,
          s.station_code,
          s.max_capacity,
          COALESCE(b.bike_count, 0) AS bike_count,
          ROUND(COALESCE(b.bike_count, 0) / NULLIF(s.max_capacity, 0) * 100) AS load_rate
        FROM stations s
        LEFT JOIN (
          SELECT station_id, COUNT(*) AS bike_count
          FROM equipments
          WHERE station_id IS NOT NULL
          GROUP BY station_id
        ) b ON b.station_id = s.id
        ORDER BY load_rate DESC, bike_count DESC
      `),

      // 3. 近 7 天订单量与营收趋势（按天）
      db.query(`
        SELECT
          DATE(o.start_time) AS day,
          COUNT(*) AS order_count,
          ROUND(COALESCE(SUM(o.actual_amount), 0), 2) AS revenue
        FROM orders o
        WHERE o.start_time >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE(o.start_time)
        ORDER BY day ASC
      `),

      // 4a. 维修效率：待处理数 + 平均修复时长（分钟）
      db.query(`
        SELECT
          SUM(repair_status <> 'done') AS pending_total,
          SUM(repair_status = 'done') AS done_total,
          ROUND(AVG(CASE WHEN repair_status = 'done' AND handled_at IS NOT NULL
            THEN TIMESTAMPDIFF(MINUTE, reported_at, handled_at) END)) AS avg_repair_minutes
        FROM maintenance_logs
      `),

      // 4b. 调度效率：各状态任务数
      db.query(`SELECT task_status AS status, COUNT(*) AS total FROM dispatch_tasks GROUP BY task_status`)
    ])

    // 计算车辆利用率（使用中 / 总数）
    const equipmentTotal = equipmentStatus.reduce((sum, item) => sum + Number(item.total), 0)
    const inUseCount = Number(equipmentStatus.find((item) => item.status === 'in_use')?.total || 0)
    const utilizationRate = equipmentTotal > 0 ? Math.round((inUseCount / equipmentTotal) * 100) : 0

    // 调度任务完成率
    const taskTotal = dispatchEfficiency.reduce((sum, item) => sum + Number(item.total), 0)
    const doneTask = Number(dispatchEfficiency.find((item) => item.status === 'done')?.total || 0)
    const taskCompletionRate = taskTotal > 0 ? Math.round((doneTask / taskTotal) * 100) : 0

    res.json({
      code: 0,
      message: 'success',
      data: {
        equipmentStatus: equipmentStatus.map((item) => ({ status: item.status, total: Number(item.total) })),
        equipmentTotal,
        utilizationRate,
        stationLoad: stationLoad.map((item) => ({
          id: item.id,
          station_name: item.station_name,
          station_code: item.station_code,
          max_capacity: Number(item.max_capacity),
          bike_count: Number(item.bike_count),
          load_rate: Number(item.load_rate || 0)
        })),
        revenueTrend: revenueTrend.map((item) => ({
          day: item.day,
          order_count: Number(item.order_count),
          revenue: Number(item.revenue)
        })),
        maintenance: {
          pending_total: Number(maintenanceEfficiency[0]?.pending_total || 0),
          done_total: Number(maintenanceEfficiency[0]?.done_total || 0),
          avg_repair_minutes: Number(maintenanceEfficiency[0]?.avg_repair_minutes || 0)
        },
        dispatch: {
          taskTotal,
          taskCompletionRate,
          byStatus: dispatchEfficiency.map((item) => ({ status: item.status, total: Number(item.total) }))
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router
