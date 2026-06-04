import express from 'express'
import { createCrudRouter } from '../utils/crud.js'

const crudRouter = createCrudRouter({
  table: 'dispatch_tasks',
  listOrderBy: 'id DESC',
  createFields: ['task_no', 'staff_id', 'from_station_id', 'to_station_id', 'equipment_ids', 'task_type', 'planned_at', 'started_at', 'finished_at', 'task_status', 'remark'],
  updateFields: ['staff_id', 'from_station_id', 'to_station_id', 'equipment_ids', 'task_type', 'planned_at', 'started_at', 'finished_at', 'task_status', 'remark']
})

// 自定义业务路由必须先于 crud 通配路由(GET /:id)注册，否则 /suggestions 会被当成 id
const router = express.Router()

function haversineMeters(a, b) {
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

// 收集所有被未完成调度工单(pending/doing)占用的设备 id。
// equipment_ids 是 JSON 数组，这里在 JS 层解析以兼容 MySQL / MariaDB。
async function getOccupiedEquipmentIds(db) {
  const rows = await db.query(
    `SELECT equipment_ids FROM dispatch_tasks WHERE task_status IN ('pending', 'doing')`
  )
  const ids = new Set()
  for (const row of rows) {
    const raw = row.equipment_ids
    const list = Array.isArray(raw) ? raw : JSON.parse(raw || '[]')
    for (const id of list) ids.add(Number(id))
  }
  return ids
}

// 统一的失衡分析：按 balanceRatio 计算每站目标车数，得出盈余站(donor)与缺车站(receiver)
// 注意：空闲车统计会排除已被未完成调度工单(pending/doing)占用的车辆，
// 否则同一批车会被反复算作可调度，导致建议无限重复、工单重复占用。
async function analyzeImbalance(db, balanceRatio) {
  const occupiedIds = await getOccupiedEquipmentIds(db)
  const excludeClause = occupiedIds.size > 0
    ? `AND e.id NOT IN (${[...occupiedIds].map(() => '?').join(', ')})`
    : ''
  const params = occupiedIds.size > 0 ? [...occupiedIds] : []

  const stations = await db.query(
    `
      SELECT
        s.id,
        s.station_code,
        s.station_name,
        s.max_capacity,
        ST_X(s.location) AS lng,
        ST_Y(s.location) AS lat,
        COALESCE(b.bike_count, 0) AS bike_count
      FROM stations s
      LEFT JOIN (
        SELECT e.station_id, COUNT(*) AS bike_count
        FROM equipments e
        WHERE e.station_id IS NOT NULL
          AND e.equipment_status = 'idle'
          ${excludeClause}
        GROUP BY e.station_id
      ) b ON b.station_id = s.id
    `,
    params
  )

  const enriched = stations.map((station) => {
    const capacity = Number(station.max_capacity || 0)
    const bikeCount = Number(station.bike_count || 0)
    const targetCount = Math.max(1, Math.round(capacity * balanceRatio))
    const surplus = Math.max(0, bikeCount - targetCount)
    const deficit = Math.max(0, targetCount - bikeCount)
    return { ...station, capacity, bikeCount, targetCount, surplus, deficit }
  })

  return {
    stations: enriched,
    donors: enriched.filter((s) => s.surplus > 0),
    receivers: enriched.filter((s) => s.deficit > 0),
    occupiedIds
  }
}

// 生成按分值排序的调度建议（不落库）。score = 失衡度 ÷ (1 + 距离km)
function buildSuggestions({ donors, receivers }, desiredMoveCount, maxSuggestions = 5) {
  const pairs = []
  for (const donor of donors) {
    for (const receiver of receivers) {
      if (donor.id === receiver.id) continue
      const distance = haversineMeters(donor, receiver)
      const imbalance = donor.surplus + receiver.deficit
      const score = imbalance / (1 + distance / 1000)
      const moveCount = Math.max(1, Math.min(desiredMoveCount, donor.surplus, receiver.deficit))
      pairs.push({ donor, receiver, distance, score, moveCount })
    }
  }

  pairs.sort((a, b) => b.score - a.score)

  // 贪心去重：每个站点在一批建议里只承担一次供/受，避免互相冲突
  const usedDonors = new Set()
  const usedReceivers = new Set()
  const picked = []
  for (const pair of pairs) {
    if (usedDonors.has(pair.donor.id) || usedReceivers.has(pair.receiver.id)) continue
    usedDonors.add(pair.donor.id)
    usedReceivers.add(pair.receiver.id)
    picked.push(pair)
    if (picked.length >= maxSuggestions) break
  }

  return picked.map((pair) => ({
    from_station_id: pair.donor.id,
    from_station_name: pair.donor.station_name,
    from_bike_count: pair.donor.bikeCount,
    to_station_id: pair.receiver.id,
    to_station_name: pair.receiver.station_name,
    to_bike_count: pair.receiver.bikeCount,
    to_target_count: pair.receiver.targetCount,
    move_count: pair.moveCount,
    distance_meters: Math.round(pair.distance),
    score: Math.round(pair.score * 100) / 100,
    reason: `${pair.donor.station_name} 现有 ${pair.donor.bikeCount} 辆（盈余 ${pair.donor.surplus}），${pair.receiver.station_name} 仅 ${pair.receiver.bikeCount} 辆（缺 ${pair.receiver.deficit}），相距约 ${Math.round(pair.distance)} 米，建议调拨 ${pair.moveCount} 辆`
  }))
}

router.put('/:id/accept', async (req, res, next) => {
  try {
    await req.app.locals.db.query(
      `UPDATE dispatch_tasks SET task_status = 'doing', started_at = COALESCE(started_at, NOW()) WHERE id = ? AND task_status <> 'done'`,
      [req.params.id]
    )
    res.json({ code: 0, message: '任务已接单', data: { id: Number(req.params.id) } })
  } catch (error) {
    next(error)
  }
})

router.put('/:id/finish', async (req, res, next) => {
  try {
    await req.app.locals.db.withTransaction(async (connection) => {
      const [taskRows] = await connection.query('SELECT * FROM dispatch_tasks WHERE id = ? FOR UPDATE', [req.params.id])
      const task = taskRows[0]
      if (!task) throw new Error('调度任务不存在')
      if (task.task_status === 'done') throw new Error('调度任务已完成')

      const equipmentIds = Array.isArray(task.equipment_ids)
        ? task.equipment_ids
        : JSON.parse(task.equipment_ids || '[]')

      if (equipmentIds.length > 0) {
        await connection.query(
          `UPDATE equipments SET station_id = ?, equipment_status = 'idle' WHERE id IN (?)`,
          [task.to_station_id, equipmentIds]
        )
      }

      await connection.query(`UPDATE dispatch_tasks SET task_status = 'done', finished_at = NOW() WHERE id = ?`, [req.params.id])
    })
    res.json({ code: 0, message: '任务已完成', data: { id: Number(req.params.id) } })
  } catch (error) {
    next(error)
  }
})

// 只读：返回按分值排序的调度建议列表，不落库。前端用于"先预览后采纳"
router.get('/suggestions', async (req, res, next) => {
  try {
    const desiredMoveCount = Math.max(Number(req.query.desiredMoveCount || 3), 1)
    const balanceRatio = Math.min(Math.max(Number(req.query.balanceRatio || 0.5), 0.2), 0.8)
    const analysis = await analyzeImbalance(req.app.locals.db, balanceRatio)

    const suggestions = buildSuggestions(analysis, desiredMoveCount)
    res.json({
      code: 0,
      message: 'success',
      data: {
        balanceRatio,
        desiredMoveCount,
        stationTotal: analysis.stations.length,
        donorTotal: analysis.donors.length,
        receiverTotal: analysis.receivers.length,
        suggestions
      }
    })
  } catch (error) {
    next(error)
  }
})

router.post('/auto', async (req, res, next) => {
  try {
    const desiredMoveCount = Math.max(Number(req.body.desiredMoveCount || 3), 1)
    const balanceRatio = Math.min(Math.max(Number(req.body.balanceRatio || 0.5), 0.2), 0.8)
    // 可选：采纳具体建议时由前端指定供/受站点；否则自动挑分值最高的一对
    const forcedFromId = req.body.from_station_id ? Number(req.body.from_station_id) : null
    const forcedToId = req.body.to_station_id ? Number(req.body.to_station_id) : null

    const analysis = await analyzeImbalance(req.app.locals.db, balanceRatio)
    const { donors, receivers } = analysis

    if (!donors.length || !receivers.length) {
      return res.json({ code: 0, message: '暂无明显失衡站点', data: null })
    }

    let chosen = null
    if (forcedFromId && forcedToId) {
      const donor = donors.find((s) => s.id === forcedFromId)
      const receiver = receivers.find((s) => s.id === forcedToId)
      if (!donor || !receiver) {
        return res.json({ code: 0, message: '指定的站点已不再失衡，请刷新建议', data: null })
      }
      chosen = { donor, receiver, distance: haversineMeters(donor, receiver) }
    } else {
      const [best] = buildSuggestions(analysis, desiredMoveCount, 1)
      if (!best) return res.json({ code: 0, message: '未找到合适的调度对', data: null })
      const donor = donors.find((s) => s.id === best.from_station_id)
      const receiver = receivers.find((s) => s.id === best.to_station_id)
      chosen = { donor, receiver, distance: best.distance_meters }
    }

    const moveCount = Math.max(1, Math.min(desiredMoveCount, chosen.donor.surplus, chosen.receiver.deficit))
    const staffRows = await req.app.locals.db.query(
      'SELECT * FROM staffs WHERE staff_status = ? ORDER BY updated_at ASC LIMIT 1',
      ['active']
    )
    if (!staffRows[0]) {
      return res.json({ code: 0, message: '暂无可用调度人员', data: null })
    }

    // 选车时排除已被未完成工单占用的车辆，并在事务内锁定，避免并发重复占用
    let createdTask = null
    await req.app.locals.db.withTransaction(async (connection) => {
      const occupiedIds = await getOccupiedEquipmentIds({ query: async (sql, params) => {
        const [rows] = await connection.query(sql, params)
        return rows
      } })
      const excludeClause = occupiedIds.size > 0
        ? `AND id NOT IN (${[...occupiedIds].map(() => '?').join(', ')})`
        : ''
      const selectParams = [chosen.donor.id, ...(occupiedIds.size > 0 ? [...occupiedIds] : []), moveCount]

      const [equipmentRows] = await connection.query(
        `SELECT id FROM equipments
         WHERE station_id = ? AND equipment_status = 'idle' ${excludeClause}
         ORDER BY updated_at ASC LIMIT ?
         FOR UPDATE`,
        selectParams
      )
      const equipmentIds = equipmentRows.map((item) => item.id)
      if (!equipmentIds.length) {
        throw new Error('供给站暂无可调度车辆（可能已被其他工单占用）')
      }

      const taskNo = `DT${Date.now()}${Math.floor(Math.random() * 900 + 100)}`
      const plannedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
      const remark = `距离约 ${Math.round(chosen.distance)} 米，搬运 ${equipmentIds.length} 辆车`
      const [result] = await connection.query(
        `INSERT INTO dispatch_tasks (task_no, staff_id, from_station_id, to_station_id, equipment_ids, planned_at, task_type, task_status, remark)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          taskNo,
          staffRows[0].id,
          chosen.donor.id,
          chosen.receiver.id,
          JSON.stringify(equipmentIds),
          plannedAt,
          'relocation',
          'pending',
          remark
        ]
      )

      createdTask = {
        id: result.insertId,
        task_no: taskNo,
        from_station_id: chosen.donor.id,
        from_station_name: chosen.donor.station_name,
        to_station_id: chosen.receiver.id,
        to_station_name: chosen.receiver.station_name,
        distance: Math.round(chosen.distance),
        equipment_ids: equipmentIds
      }
    })

    res.json({
      code: 0,
      message: '已生成调度任务',
      data: createdTask
    })
  } catch (error) {
    next(error)
  }
})

// crud 通配路由(GET / 、GET /:id 、POST / 、PUT /:id 、DELETE /:id)放最后兜底
router.use('/', crudRouter)

export default router
