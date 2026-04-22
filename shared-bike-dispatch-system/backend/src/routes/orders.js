import express from 'express'
import { createCrudRouter } from '../utils/crud.js'

const router = createCrudRouter({
  table: 'orders',
  listOrderBy: 'id DESC',
  createFields: ['order_no', 'user_id', 'equipment_id', 'start_station_id', 'end_station_id', 'coupon_id', 'start_time', 'end_time', 'expected_amount', 'actual_amount', 'order_status', 'remark'],
  updateFields: ['end_station_id', 'coupon_id', 'end_time', 'expected_amount', 'actual_amount', 'order_status', 'remark']
})

router.put('/:id/return', async (req, res, next) => {
  try {
    const { end_station_id, actual_amount = 0 } = req.body
    await req.app.locals.db.query(
      `UPDATE orders SET end_station_id = ?, end_time = NOW(), actual_amount = ?, order_status = 'completed' WHERE id = ?`,
      [end_station_id, actual_amount, req.params.id]
    )
    res.json({ code: 0, message: '订单已归还', data: { id: Number(req.params.id) } })
  } catch (error) {
    next(error)
  }
})

router.put('/:id/cancel', async (req, res, next) => {
  try {
    await req.app.locals.db.query(`UPDATE orders SET order_status = 'cancelled' WHERE id = ?`, [req.params.id])
    res.json({ code: 0, message: '订单已取消', data: { id: Number(req.params.id) } })
  } catch (error) {
    next(error)
  }
})

export default router
