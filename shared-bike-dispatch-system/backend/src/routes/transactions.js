import express from 'express'
import { createCrudRouter } from '../utils/crud.js'

const router = createCrudRouter({
  table: 'transactions',
  listOrderBy: 'happened_at DESC',
  createFields: ['tx_no', 'user_id', 'order_id', 'tx_type', 'amount', 'balance_before', 'balance_after', 'channel', 'tx_status', 'happened_at'],
  updateFields: ['tx_type', 'amount', 'channel', 'tx_status']
})

// 按用户查询流水
router.get('/user/:userId', async (req, res, next) => {
  try {
    const userId = Number(req.params.userId)
    const rows = await req.app.locals.db.query('SELECT * FROM transactions WHERE user_id = ? ORDER BY happened_at DESC', [userId])
    res.json({ code: 0, message: 'success', data: rows })
  } catch (error) {
    next(error)
  }
})

export default router
