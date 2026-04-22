import { createCrudRouter } from '../utils/crud.js'

export default createCrudRouter({
  table: 'equipments',
  listOrderBy: 'id DESC',
  createFields: ['station_id', 'equipment_code', 'equipment_type', 'battery_level', 'hardware_version', 'equipment_status', 'last_maintenance_at'],
  updateFields: ['station_id', 'equipment_code', 'equipment_type', 'battery_level', 'hardware_version', 'equipment_status', 'last_maintenance_at']
})
