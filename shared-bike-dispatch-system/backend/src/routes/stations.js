import { createCrudRouter } from '../utils/crud.js'

export default createCrudRouter({
  table: 'stations',
  listOrderBy: 'id DESC',
  createFields: ['station_code', 'station_name', 'address', 'location', 'max_capacity', 'available_slots', 'station_status'],
  updateFields: ['station_code', 'station_name', 'address', 'location', 'max_capacity', 'available_slots', 'station_status']
})
