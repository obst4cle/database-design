import { createCrudRouter } from '../utils/crud.js'

function buildLocationPayload(payload) {
  const { longitude, latitude, ...rest } = payload
  if (rest.location) return rest

  const lng = Number(longitude)
  const lat = Number(latitude)
  if (Number.isFinite(lng) && Number.isFinite(lat)) {
    return {
      ...rest,
      location: { __rawSql: `ST_GeomFromText('POINT(${lng} ${lat})')` }
    }
  }

  return rest
}

export default createCrudRouter({
  table: 'stations',
  listOrderBy: 'id DESC',
  createFields: ['station_code', 'station_name', 'address', 'longitude', 'latitude', 'max_capacity', 'station_status'],
  updateFields: ['station_code', 'station_name', 'address', 'longitude', 'latitude', 'max_capacity', 'station_status'],
  beforeCreate: async (payload) => buildLocationPayload(payload),
  beforeUpdate: async (payload) => buildLocationPayload(payload),
  afterList: async (rows, req) => {
    if (!rows.length) return rows
    const ids = rows.map((row) => row.id)
    const placeholders = ids.map(() => '?').join(', ')
    const locationRows = await req.app.locals.db.query(
      `SELECT id, ST_X(location) AS longitude, ST_Y(location) AS latitude FROM stations WHERE id IN (${placeholders})`,
      ids
    )
    const locationMap = new Map(locationRows.map((item) => [Number(item.id), item]))

    const parkedRows = await req.app.locals.db.query(
      `SELECT station_id, COUNT(*) AS parked FROM equipments WHERE station_id IN (${placeholders}) GROUP BY station_id`,
      ids
    )
    const parkedMap = new Map(parkedRows.map((item) => [Number(item.station_id), Number(item.parked)]))

    return rows.map((row) => {
      const capacity = Number(row.max_capacity || 0)
      const parked = parkedMap.get(Number(row.id)) || 0
      return {
        ...row,
        longitude: locationMap.get(Number(row.id))?.longitude ?? null,
        latitude: locationMap.get(Number(row.id))?.latitude ?? null,
        parked_count: parked,
        available_slots: Math.max(0, capacity - parked)
      }
    })
  },
  afterItem: async (row, req) => {
    if (!row) return row
    const locationRows = await req.app.locals.db.query(
      'SELECT id, ST_X(location) AS longitude, ST_Y(location) AS latitude FROM stations WHERE id = ? LIMIT 1',
      [row.id]
    )
    const location = locationRows[0]
    const parkedRows = await req.app.locals.db.query(
      'SELECT COUNT(*) AS parked FROM equipments WHERE station_id = ?',
      [row.id]
    )
    const parked = Number(parkedRows[0]?.parked || 0)
    const capacity = Number(row.max_capacity || 0)
    return {
      ...row,
      longitude: location?.longitude ?? null,
      latitude: location?.latitude ?? null,
      parked_count: parked,
      available_slots: Math.max(0, capacity - parked)
    }
  }
})
