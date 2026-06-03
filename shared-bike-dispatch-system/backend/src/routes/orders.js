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

function buildBusinessNo(prefix) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 900 + 100)}`
}

router.post('/start', async (req, res, next) => {
  const { user_id, equipment_id, coupon_id = null } = req.body
  try {
    if (!user_id || !equipment_id) {
      return res.status(400).json({ code: 40001, message: '请选择用户和车辆', data: null })
    }

    let createdOrder = null
    await req.app.locals.db.withTransaction(async (connection) => {
      const [equipmentRows] = await connection.query('SELECT * FROM equipments WHERE id = ? FOR UPDATE', [equipment_id])
      const equipment = equipmentRows[0]
      if (!equipment) throw new Error('车辆不存在')
      if (equipment.equipment_status !== 'idle') throw new Error('车辆当前不可借')
      if (!equipment.station_id) throw new Error('车辆未绑定站点')

      const [userRows] = await connection.query('SELECT * FROM users WHERE id = ? FOR UPDATE', [user_id])
      const user = userRows[0]
      if (!user) throw new Error('用户不存在')
      if (user.account_status !== 'active') throw new Error('用户状态不可用')

      let usableCouponId = null
      if (coupon_id) {
        const [couponRows] = await connection.query(
          'SELECT * FROM promotion_coupons WHERE id = ? AND user_id = ? FOR UPDATE',
          [coupon_id, user_id]
        )
        const coupon = couponRows[0]
        if (!coupon) throw new Error('优惠券不存在')
        if (coupon.is_used) throw new Error('优惠券已使用')
        if (new Date(coupon.expire_at) < new Date()) throw new Error('优惠券已过期')
        usableCouponId = coupon.id
      }

      const orderNo = buildBusinessNo('OD')
      const expectedAmount = pricing.initial_fee
      const [result] = await connection.query(
        `INSERT INTO orders (order_no, user_id, equipment_id, start_station_id, coupon_id, start_time, expected_amount, actual_amount, order_status, remark)
         VALUES (?, ?, ?, ?, ?, NOW(), ?, 0, 'active', ?)`,
        [orderNo, user.id, equipment.id, equipment.station_id, usableCouponId, expectedAmount, '演示流程创建订单']
      )

      await connection.query(
        `UPDATE equipments SET equipment_status = 'in_use', station_id = NULL WHERE id = ?`,
        [equipment.id]
      )
      await connection.query(
        `UPDATE stations SET available_slots = LEAST(max_capacity, available_slots + 1) WHERE id = ?`,
        [equipment.station_id]
      )

      createdOrder = {
        id: result.insertId,
        order_no: orderNo,
        start_station_id: equipment.station_id
      }
    })

    res.status(201).json({ code: 0, message: '订单已创建，车辆已借出', data: createdOrder })
  } catch (error) {
    next(error)
  }
})

router.put('/:id/return', async (req, res, next) => {
  const id = Number(req.params.id)
  const { end_station_id, simulated_minutes } = req.body
  try {
    let completedOrder = null
    await req.app.locals.db.withTransaction(async (connection) => {
      const [orderRows] = await connection.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [id])
      const order = orderRows[0]
      if (!order) throw new Error('订单不存在')
      if (order.order_status === 'completed') {
        return {
          id,
          order_no: order.order_no,
          message: '订单已完成，无需重复归还'
        }
      }
      if (order.order_status === 'cancelled') throw new Error('订单已取消')

      let resolvedEndStationId = null
      if (end_station_id !== undefined && end_station_id !== null && end_station_id !== '') {
        resolvedEndStationId = Number(end_station_id)
        if (!Number.isFinite(resolvedEndStationId) || resolvedEndStationId <= 0) {
          throw new Error('归还站点 ID 不合法')
        }

        const [stationRows] = await connection.query('SELECT id FROM stations WHERE id = ? FOR UPDATE', [resolvedEndStationId])
        if (!stationRows[0]) throw new Error('归还站点不存在')
      }

      const simulatedMinutes = Number(simulated_minutes)
      const startTime = new Date(order.start_time)
      const realMinutes = Math.ceil((new Date() - startTime) / 60000)
      const minutes = Number.isFinite(simulatedMinutes) && simulatedMinutes > 0
        ? Math.ceil(simulatedMinutes)
        : Math.max(1, realMinutes)

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
        `UPDATE orders
         SET end_station_id = ?,
             end_time = DATE_ADD(start_time, INTERVAL ? MINUTE),
             expected_amount = ?,
             actual_amount = ?,
             order_status = 'completed'
         WHERE id = ?`,
        [resolvedEndStationId, minutes, amount, amount, id]
      )

      // 尝试恢复车辆状态并更新站点空位（最小化影响，忽略失败）
      try {
        await connection.query('UPDATE equipments SET station_id = ?, equipment_status = ? WHERE id = ?', [resolvedEndStationId, 'idle', order.equipment_id])
        if (resolvedEndStationId) {
          await connection.query('UPDATE stations SET available_slots = GREATEST(available_slots - 1, 0) WHERE id = ?', [resolvedEndStationId])
        }
      } catch (e) {
        // 不影响主要事务逻辑
        console.warn('equipment/station update failed', e)
      }

      completedOrder = {
        id,
        order_no: order.order_no,
        end_station_id: resolvedEndStationId,
        ride_minutes: minutes,
        actual_amount: amount
      }
    })

    res.json({ code: 0, message: '订单已归还并已计费', data: completedOrder || { id } })
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
