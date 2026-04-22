import bcrypt from 'bcryptjs'
import { createCrudRouter } from '../utils/crud.js'

export default createCrudRouter({
  table: 'users',
  listOrderBy: 'id DESC',
  createFields: ['rank_id', 'username', 'password', 'phone', 'real_name', 'is_verified', 'balance', 'credit_score', 'account_status'],
  updateFields: ['rank_id', 'phone', 'real_name', 'is_verified', 'balance', 'credit_score', 'account_status'],
  beforeCreate: async (data) => {
    const { password, ...rest } = data
    return {
      ...rest,
      password_hash: await bcrypt.hash(String(password || ''), 10)
    }
  }
})
