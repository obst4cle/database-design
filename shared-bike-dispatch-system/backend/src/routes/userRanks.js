import { createCrudRouter } from '../utils/crud.js'

// 会员等级（基本只读字典，提供 CRUD 以便后台维护折扣/押金策略）
export default createCrudRouter({
  table: 'user_ranks',
  listOrderBy: 'id ASC',
  createFields: ['rank_code', 'rank_name', 'discount_rate', 'deposit_amount', 'description'],
  updateFields: ['rank_code', 'rank_name', 'discount_rate', 'deposit_amount', 'description']
})
