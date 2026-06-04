import express from 'express'
import cors from 'cors'
import { pool, query, withTransaction } from './db.js'
import authRouter from './routes/auth.js'
import usersRouter from './routes/users.js'
import userRanksRouter from './routes/userRanks.js'
import stationsRouter from './routes/stations.js'
import equipmentsRouter from './routes/equipments.js'
import ordersRouter from './routes/orders.js'
import couponsRouter from './routes/coupons.js'
import staffsRouter from './routes/staffs.js'
import maintenanceRouter from './routes/maintenance.js'
import dispatchRouter from './routes/dispatch.js'
import transactionsRouter from './routes/transactions.js'
import dashboardRouter from './routes/dashboard.js'
import { authRequired } from './middleware/auth.js'

const app = express()

app.locals.db = { query, withTransaction }
app.locals.pool = pool

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'ok', data: { service: 'shared-bike-dispatch-backend' } })
})

app.use('/api/auth', authRouter)

// 以下业务接口均需登录鉴权（/auth 与 /health 保持公开）
app.use('/api/users', authRequired, usersRouter)
app.use('/api/user-ranks', authRequired, userRanksRouter)
app.use('/api/stations', authRequired, stationsRouter)
app.use('/api/equipments', authRequired, equipmentsRouter)
app.use('/api/orders', authRequired, ordersRouter)
app.use('/api/coupons', authRequired, couponsRouter)
app.use('/api/staffs', authRequired, staffsRouter)
app.use('/api/maintenance-logs', authRequired, maintenanceRouter)
app.use('/api/dispatch-tasks', authRequired, dispatchRouter)
app.use('/api/transactions', authRequired, transactionsRouter)
app.use('/api/dashboard', authRequired, dashboardRouter)

app.use((error, req, res, next) => {
  console.error(error)
  const status = error.statusCode || error.status || 500
  res.status(status).json({ code: status * 100, message: error.message || '服务器内部错误', data: null })
})

export default app
