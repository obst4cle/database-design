import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'

const router = express.Router()

router.post('/register', async (req, res, next) => {
  try {
    const { username, password, phone, rank_id = 1, real_name = null } = req.body
    if (!username || !password || !phone) {
      return res.status(400).json({ code: 40001, message: '参数不完整', data: null })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const result = await req.app.locals.db.query(
      `INSERT INTO users (rank_id, username, password_hash, phone, real_name) VALUES (?, ?, ?, ?, ?)`,
      [rank_id, username, passwordHash, phone, real_name]
    )

    res.status(201).json({ code: 0, message: '注册成功', data: { id: result.insertId } })
  } catch (error) {
    next(error)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const { account, password } = req.body
    if (!account || !password) {
      return res.status(400).json({ code: 40001, message: '参数不完整', data: null })
    }

    const rows = await req.app.locals.db.query(
      `SELECT id, username, phone, password_hash, rank_id, balance, credit_score, account_status FROM users WHERE username = ? OR phone = ? LIMIT 1`,
      [account, account]
    )

    const user = rows[0]
    if (!user) {
      return res.status(400).json({ code: 40002, message: '用户不存在', data: null })
    }

    const matched = await bcrypt.compare(password, user.password_hash)
    if (!matched) {
      return res.status(400).json({ code: 40003, message: '用户名或密码错误', data: null })
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, phone: user.phone, rankId: user.rank_id },
      config.jwtSecret,
      { expiresIn: '7d' }
    )

    await req.app.locals.db.query(`UPDATE users SET last_login_at = NOW() WHERE id = ?`, [user.id])

    res.json({
      code: 0,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          phone: user.phone,
          rankId: user.rank_id,
          balance: user.balance,
          creditScore: user.credit_score,
          accountStatus: user.account_status
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (!token) {
      return res.status(401).json({ code: 40101, message: '未登录', data: null })
    }

    const payload = jwt.verify(token, config.jwtSecret)
    const rows = await req.app.locals.db.query(
      `SELECT id, username, phone, rank_id, balance, credit_score, account_status FROM users WHERE id = ? LIMIT 1`,
      [payload.id]
    )
    res.json({ code: 0, message: 'success', data: rows[0] || null })
  } catch (error) {
    next(error)
  }
})

export default router
