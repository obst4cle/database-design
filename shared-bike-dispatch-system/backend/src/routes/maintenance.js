import { createCrudRouter } from '../utils/crud.js'

const router = createCrudRouter({
  table: 'maintenance_logs',
  listOrderBy: 'id DESC',
  createFields: ['equipment_id', 'staff_id', 'fault_type', 'fault_description', 'reported_at', 'repair_status', 'handled_at', 'repair_result'],
  updateFields: ['staff_id', 'fault_type', 'fault_description', 'reported_at', 'repair_status', 'handled_at', 'repair_result']
})

router.put('/:id/start', async (req, res, next) => {
  try {
    await req.app.locals.db.withTransaction(async (connection) => {
      const [rows] = await connection.query('SELECT * FROM maintenance_logs WHERE id = ? FOR UPDATE', [req.params.id])
      const log = rows[0]
      if (!log) throw new Error('维修记录不存在')
      if (log.repair_status === 'done') throw new Error('维修记录已完成')

      await connection.query(
        `UPDATE maintenance_logs SET repair_status = 'processing', handled_at = COALESCE(handled_at, NOW()) WHERE id = ?`,
        [req.params.id]
      )
      await connection.query(
        `UPDATE equipments SET equipment_status = 'maintenance' WHERE id = ?`,
        [log.equipment_id]
      )
    })

    res.json({ code: 0, message: '维修已开始，车辆已标记为维修中', data: { id: Number(req.params.id) } })
  } catch (error) {
    next(error)
  }
})

router.put('/:id/finish', async (req, res, next) => {
  const repairResult = req.body.repair_result || '故障已处理，车辆恢复可用'
  try {
    await req.app.locals.db.withTransaction(async (connection) => {
      const [rows] = await connection.query('SELECT * FROM maintenance_logs WHERE id = ? FOR UPDATE', [req.params.id])
      const log = rows[0]
      if (!log) throw new Error('维修记录不存在')

      await connection.query(
        `UPDATE maintenance_logs SET repair_status = 'done', handled_at = NOW(), repair_result = ? WHERE id = ?`,
        [repairResult, req.params.id]
      )
      await connection.query(
        `UPDATE equipments SET equipment_status = 'idle', last_maintenance_at = NOW() WHERE id = ?`,
        [log.equipment_id]
      )
    })

    res.json({ code: 0, message: '维修已完成，车辆已恢复可用', data: { id: Number(req.params.id) } })
  } catch (error) {
    next(error)
  }
})

export default router
