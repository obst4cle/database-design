import express from 'express'
import { createCrudRouter } from '../utils/crud.js'

const router = createCrudRouter({
  table: 'promotion_coupons',
  listOrderBy: 'id DESC',
  createFields: ['user_id', 'order_id', 'coupon_code', 'coupon_name', 'coupon_type', 'face_value', 'min_spend', 'expire_at', 'used_at', 'is_used', 'source'],
  updateFields: ['order_id', 'coupon_name', 'coupon_type', 'face_value', 'min_spend', 'expire_at', 'used_at', 'is_used', 'source']
})

router.put('/:id/use', async (req, res, next) => {
  try {
    await req.app.locals.db.query(
      `UPDATE promotion_coupons SET is_used = 1, used_at = NOW(), order_id = ? WHERE id = ?`,
      [req.body.order_id || null, req.params.id]
    )
    res.json({ code: 0, message: '优惠券已核销', data: { id: Number(req.params.id) } })
  } catch (error) {
    next(error)
  }
})

router.put('/:id/disable', async (req, res, next) => {
  try {
    await req.app.locals.db.query(`UPDATE promotion_coupons SET expire_at = NOW() WHERE id = ?`, [req.params.id])
    res.json({ code: 0, message: '优惠券已失效', data: { id: Number(req.params.id) } })
  } catch (error) {
    next(error)
  }
})

export default router
