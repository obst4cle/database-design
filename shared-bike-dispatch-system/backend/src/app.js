import express from 'express'
import cors from 'cors'
import { pool, query, withTransaction } from './db.js'
import authRouter from './routes/auth.js'
import usersRouter from './routes/users.js'
import stationsRouter from './routes/stations.js'
import equipmentsRouter from './routes/equipments.js'
import ordersRouter from './routes/orders.js'
import couponsRouter from './routes/coupons.js'
import staffsRouter from './routes/staffs.js'
import maintenanceRouter from './routes/maintenance.js'
import dispatchRouter from './routes/dispatch.js'
import transactionsRouter from './routes/transactions.js'
import dashboardRouter from './routes/dashboard.js'

const app = express()

app.locals.db = { query, withTransaction }
app.locals.pool = pool

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'ok', data: { service: 'shared-bike-dispatch-backend' } })
})

app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/stations', stationsRouter)
app.use('/api/equipments', equipmentsRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/coupons', couponsRouter)
app.use('/api/staffs', staffsRouter)
app.use('/api/maintenance-logs', maintenanceRouter)
app.use('/api/dispatch-tasks', dispatchRouter)
app.use('/api/transactions', transactionsRouter)
app.use('/api/dashboard', dashboardRouter)

app.use((error, req, res, next) => {
  console.error(error)
  const status = error.statusCode || error.status || 500
  res.status(status).json({ code: status * 100, message: error.message || '服务器内部错误', data: null })
})

export default app
