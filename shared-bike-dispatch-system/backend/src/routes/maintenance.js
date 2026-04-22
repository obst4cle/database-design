import { createCrudRouter } from '../utils/crud.js'

export default createCrudRouter({
  table: 'maintenance_logs',
  listOrderBy: 'id DESC',
  createFields: ['equipment_id', 'staff_id', 'fault_type', 'fault_description', 'reported_at', 'repair_status', 'handled_at', 'repair_result'],
  updateFields: ['staff_id', 'fault_type', 'fault_description', 'reported_at', 'repair_status', 'handled_at', 'repair_result']
})
