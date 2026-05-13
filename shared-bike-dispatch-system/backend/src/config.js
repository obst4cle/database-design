import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: Number(process.env.PORT || 3000),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shared_bike_dispatch'
  },
  jwtSecret: process.env.JWT_SECRET || 'shared-bike-dispatch-secret'
}

// 计费配置（可通过环境变量覆盖）
export const pricing = {
  initial_fee: Number(process.env.PRICING_INITIAL_FEE || 1.0),
  per_minute: Number(process.env.PRICING_PER_MINUTE || 0.2),
  min_charge: Number(process.env.PRICING_MIN_CHARGE || 0.5)
}
