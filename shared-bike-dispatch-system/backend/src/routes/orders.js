import express from 'express'
import { createCrudRouter } from '../utils/crud.js'
import { pricing } from '../config.js'

const router = createCrudRouter({
  table: 'orders',
  listOrderBy: 'id DESC',
  createFields: ['order_no', 'user_id', 'equipment_id', 'start_station_id', 'end_station_id', 'coupon_id', 'start_time', 'end_time', 'expected_amount', 'actual_amount', 'order_status', 'remark'],
  updateFields: ['order_no', 'user_id', 'equipment_id', 'start_station_id', 'end_station_id', 'coupon_id', 'start_time', 'end_time', 'expected_amount', 'actual_amount', 'order_status', 'remark']
})

function round2(n) {
  return Math.round(n * 100) / 100
}

router.put('/:id/return', async (req, res, next) => {
  const id = Number(req.params.id)
  const { end_station_id } = req.body
  try {
    await req.app.locals.db.withTransaction(async (connection) => {
      const [orderRows] = await connection.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [id])
      const order = orderRows[0]
      if (!order) throw new Error('订单不存在')
      if (order.order_status === 'completed') throw new Error('订单已完成')

      const now = new Date()
      const startTime = new Date(order.start_time)
      const minutes = Math.max(1, Math.ceil((now - startTime) / 60000))

      // 基本计费：初始费用 + 时长费用，应用会员折扣
      const [userRows] = await connection.query('SELECT u.*, r.discount_rate FROM users u JOIN user_ranks r ON u.rank_id = r.id WHERE u.id = ? FOR UPDATE', [order.user_id])
      const user = userRows[0]
      const discount = user && user.discount_rate ? Number(user.discount_rate) : 1.0

      let amount = pricing.initial_fee + minutes * pricing.per_minute
      amount = amount * discount

      // 优惠券处理（如果存在）
      if (order.coupon_id) {
        const [couponRows] = await connection.query('SELECT * FROM promotion_coupons WHERE id = ? FOR UPDATE', [order.coupon_id])
        const coupon = couponRows[0]
        if (coupon && !coupon.is_used) {
          const meets = Number(coupon.min_spend || 0) <= amount
          if (meets) {
            amount = Math.max(0, amount - Number(coupon.face_value || 0))
            await connection.query('UPDATE promotion_coupons SET is_used = 1, used_at = NOW(), order_id = ? WHERE id = ?', [id, coupon.id])
          }
        }
      }

      amount = Math.max(amount, pricing.min_charge)
      amount = round2(amount)

      // 用户余额变更与交易流水
      const balanceBefore = Number(user.balance || 0)
      const balanceAfter = round2(balanceBefore - amount)

      await connection.query('UPDATE users SET balance = ? WHERE id = ?', [balanceAfter, user.id])

      const txNo = 'TX' + Date.now() + Math.floor(Math.random() * 900 + 100)
      await connection.query(
        `INSERT INTO transactions (tx_no, user_id, order_id, tx_type, amount, balance_before, balance_after, channel, tx_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [txNo, user.id, id, 'order_charge', amount, balanceBefore, balanceAfter, 'wallet', 'success']
      )

      // 更新订单，归还并写入实际金额
      await connection.query(
        `UPDATE orders SET end_station_id = ?, end_time = NOW(), actual_amount = ?, order_status = 'completed' WHERE id = ?`,
        [end_station_id || null, amount, id]
      )

      // 尝试恢复车辆状态并更新站点空位（最小化影响，忽略失败）
      try {
        await connection.query('UPDATE equipments SET station_id = ?, equipment_status = ? WHERE id = ?', [end_station_id || null, 'idle', order.equipment_id])
        if (end_station_id) {
          await connection.query('UPDATE stations SET available_slots = available_slots + 1 WHERE id = ?', [end_station_id])
        }
      } catch (e) {
        // 不影响主要事务逻辑
        console.warn('equipment/station update failed', e)
      }
    })

    res.json({ code: 0, message: '订单已归还并已计费', data: { id } })
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
