import { createCrudRouter } from '../utils/crud.js'

export default createCrudRouter({
  table: 'staffs',
  listOrderBy: 'id DESC',
  createFields: ['staff_code', 'staff_name', 'phone', 'district', 'job_title', 'staff_status', 'hired_at'],
  updateFields: ['staff_code', 'staff_name', 'phone', 'district', 'job_title', 'staff_status', 'hired_at']
})
