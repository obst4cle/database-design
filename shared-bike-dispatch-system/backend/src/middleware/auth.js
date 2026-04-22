import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!token) {
    return res.status(401).json({ code: 40101, message: '未登录', data: null })
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret)
    next()
  } catch (error) {
    return res.status(401).json({ code: 40102, message: '登录已过期', data: null })
  }
}
