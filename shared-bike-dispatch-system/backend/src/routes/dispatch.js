import express from 'express'
import { createCrudRouter } from '../utils/crud.js'

const router = createCrudRouter({
  table: 'dispatch_tasks',
  listOrderBy: 'id DESC',
  createFields: ['task_no', 'staff_id', 'from_station_id', 'to_station_id', 'equipment_ids', 'task_type', 'planned_at', 'started_at', 'finished_at', 'task_status', 'remark'],
  updateFields: ['staff_id', 'from_station_id', 'to_station_id', 'equipment_ids', 'task_type', 'planned_at', 'started_at', 'finished_at', 'task_status', 'remark']
})

router.put('/:id/accept', async (req, res, next) => {
  try {
    await req.app.locals.db.query(`UPDATE dispatch_tasks SET task_status = 'doing', started_at = NOW() WHERE id = ?`, [req.params.id])
    res.json({ code: 0, message: '任务已接单', data: { id: Number(req.params.id) } })
  } catch (error) {
    next(error)
  }
})

router.put('/:id/finish', async (req, res, next) => {
  try {
    await req.app.locals.db.query(`UPDATE dispatch_tasks SET task_status = 'done', finished_at = NOW() WHERE id = ?`, [req.params.id])
    res.json({ code: 0, message: '任务已完成', data: { id: Number(req.params.id) } })
  } catch (error) {
    next(error)
  }
})

router.post('/auto', async (req, res, next) => {
  try {
    const desiredMoveCount = Math.max(Number(req.body.desiredMoveCount || 3), 1)
    const balanceRatio = Math.min(Math.max(Number(req.body.balanceRatio || 0.5), 0.2), 0.8)
    const stations = await req.app.locals.db.query(
      `
        SELECT
          s.id,
          s.station_code,
          s.station_name,
          s.max_capacity,
          s.available_slots,
          ST_X(s.location) AS lng,
          ST_Y(s.location) AS lat,
          COALESCE(b.bike_count, 0) AS bike_count
        FROM stations s
        LEFT JOIN (
          SELECT station_id, COUNT(*) AS bike_count
          FROM equipments
          WHERE station_id IS NOT NULL AND equipment_status = 'idle'
          GROUP BY station_id
        ) b ON b.station_id = s.id
      `
    )

    const enrichedStations = stations.map((station) => {
      const capacity = Number(station.max_capacity || 0)
      const bikeCount = Number(station.bike_count || 0)
      const targetCount = Math.max(1, Math.round(capacity * balanceRatio))
      const surplus = Math.max(0, bikeCount - targetCount)
      const deficit = Math.max(0, targetCount - bikeCount)
      return { ...station, capacity, bikeCount, targetCount, surplus, deficit }
    })

    const donors = enrichedStations.filter((station) => station.surplus > 0)
    const receivers = enrichedStations.filter((station) => station.deficit > 0)

    if (!donors.length || !receivers.length) {
      return res.json({ code: 0, message: '暂无明显失衡站点', data: null })
    }

    function distanceMeters(a, b) {
      const earthRadius = 6371000
      const lat1 = Number(a.lat) * Math.PI / 180
      const lat2 = Number(b.lat) * Math.PI / 180
      const deltaLat = (Number(b.lat) - Number(a.lat)) * Math.PI / 180
      const deltaLng = (Number(b.lng) - Number(a.lng)) * Math.PI / 180
      const sinLat = Math.sin(deltaLat / 2)
      const sinLng = Math.sin(deltaLng / 2)
      const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng
      return 2 * earthRadius * Math.asin(Math.min(1, Math.sqrt(h)))
    }

    let bestPair = null
    for (const donor of donors) {
      for (const receiver of receivers) {
        if (donor.id === receiver.id) continue
        const distance = distanceMeters(donor, receiver)
        const imbalance = donor.surplus + receiver.deficit
        const score = imbalance / (1 + distance / 1000)
        if (!bestPair || score > bestPair.score) {
          bestPair = { donor, receiver, distance, score }
        }
      }
    }

    if (!bestPair) {
      return res.json({ code: 0, message: '未找到合适的调度对', data: null })
    }

    const moveCount = Math.max(1, Math.min(desiredMoveCount, bestPair.donor.surplus, bestPair.receiver.deficit))
    const staffRows = await req.app.locals.db.query(
      'SELECT * FROM staffs WHERE staff_status = ? ORDER BY updated_at ASC LIMIT 1',
      ['active']
    )
    if (!staffRows[0]) {
      return res.json({ code: 0, message: '暂无可用调度人员', data: null })
    }

    const equipmentRows = await req.app.locals.db.query(
      `SELECT id FROM equipments WHERE station_id = ? AND equipment_status = 'idle' ORDER BY updated_at ASC LIMIT ?`,
      [bestPair.donor.id, moveCount]
    )
    const equipmentIds = equipmentRows.map((item) => item.id)
    if (!equipmentIds.length) {
      return res.json({ code: 0, message: '供给站暂无可调度车辆', data: null })
    }

    const taskNo = `DT${Date.now()}${Math.floor(Math.random() * 900 + 100)}`
    const plannedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const remark = `距离约 ${Math.round(bestPair.distance)} 米，搬运 ${equipmentIds.length} 辆车`
    const result = await req.app.locals.db.query(
      `INSERT INTO dispatch_tasks (task_no, staff_id, from_station_id, to_station_id, equipment_ids, planned_at, task_type, task_status, remark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        taskNo,
        staffRows[0].id,
        bestPair.donor.id,
        bestPair.receiver.id,
        JSON.stringify(equipmentIds),
        plannedAt,
        'relocation',
        'pending',
        remark
      ]
    )

    res.json({
      code: 0,
      message: '已生成调度任务',
      data: {
        id: result.insertId,
        task_no: taskNo,
        from_station_id: bestPair.donor.id,
        to_station_id: bestPair.receiver.id,
        distance: Math.round(bestPair.distance),
        equipment_ids: equipmentIds
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router
