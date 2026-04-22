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

export default router
