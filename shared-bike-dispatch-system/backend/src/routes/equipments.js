import { createCrudRouter } from '../utils/crud.js'

async function attachStationName(rows, req) {
  const stationIds = [...new Set(rows.map((row) => row.station_id).filter((id) => id !== null && id !== undefined))]
  if (stationIds.length === 0) {
    return rows.map((row) => ({ ...row, station_name: null }))
  }
  const placeholders = stationIds.map(() => '?').join(', ')
  const stationRows = await req.app.locals.db.query(
    `SELECT id, station_name, station_code FROM stations WHERE id IN (${placeholders})`,
    stationIds
  )
  const stationMap = new Map(stationRows.map((item) => [Number(item.id), item]))
  return rows.map((row) => ({
    ...row,
    station_name: row.station_id != null ? (stationMap.get(Number(row.station_id))?.station_name ?? null) : null,
    station_code: row.station_id != null ? (stationMap.get(Number(row.station_id))?.station_code ?? null) : null
  }))
}

export default createCrudRouter({
  table: 'equipments',
  listOrderBy: 'id DESC',
  createFields: ['station_id', 'equipment_code', 'equipment_type', 'hardware_version', 'equipment_status', 'last_maintenance_at'],
  updateFields: ['station_id', 'equipment_code', 'equipment_type', 'hardware_version', 'equipment_status', 'last_maintenance_at'],
  afterList: async (rows, req) => {
    if (!rows.length) return rows
    return attachStationName(rows, req)
  },
  afterItem: async (row, req) => {
    if (!row) return row
    const [enriched] = await attachStationName([row], req)
    return enriched
  }
})
