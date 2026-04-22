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

export default router
