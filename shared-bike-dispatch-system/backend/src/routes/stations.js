import { createCrudRouter } from '../utils/crud.js'

function buildLocationPayload(payload) {
  if (payload.location) return payload
  const longitude = Number(payload.longitude)
  const latitude = Number(payload.latitude)
  if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
    return {
      ...payload,
      location: { __rawSql: `ST_GeomFromText('POINT(${longitude} ${latitude})')` }
    }
  }
  return payload
}

export default createCrudRouter({
  table: 'stations',
  listOrderBy: 'id DESC',
  createFields: ['station_code', 'station_name', 'address', 'longitude', 'latitude', 'location', 'max_capacity', 'available_slots', 'station_status'],
  updateFields: ['station_code', 'station_name', 'address', 'longitude', 'latitude', 'location', 'max_capacity', 'available_slots', 'station_status'],
  beforeCreate: async (payload) => buildLocationPayload(payload),
  beforeUpdate: async (payload) => buildLocationPayload(payload),
  afterList: async (rows, req) => {
    if (!rows.length) return rows
    const ids = rows.map((row) => row.id)
    const locationRows = await req.app.locals.db.query(
      `SELECT id, ST_X(location) AS longitude, ST_Y(location) AS latitude FROM stations WHERE id IN (${ids.map(() => '?').join(', ')})`,
      ids
    )
    const locationMap = new Map(locationRows.map((item) => [Number(item.id), item]))
    return rows.map((row) => ({
      ...row,
      longitude: locationMap.get(Number(row.id))?.longitude ?? null,
      latitude: locationMap.get(Number(row.id))?.latitude ?? null
    }))
  },
  afterItem: async (row, req) => {
    if (!row) return row
    const locationRows = await req.app.locals.db.query(
      'SELECT id, ST_X(location) AS longitude, ST_Y(location) AS latitude FROM stations WHERE id = ? LIMIT 1',
      [row.id]
    )
    const location = locationRows[0]
    return {
      ...row,
      longitude: location?.longitude ?? null,
      latitude: location?.latitude ?? null
    }
  }
})
