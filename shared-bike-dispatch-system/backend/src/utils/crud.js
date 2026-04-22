import express from 'express'

function pick(source, fields) {
  return fields.reduce((accumulator, field) => {
    if (source[field] !== undefined) {
      accumulator[field] = source[field]
    }
    return accumulator
  }, {})
}

function buildInsertSql(table, data) {
  const keys = Object.keys(data)
  const columns = keys.join(', ')
  const placeholders = keys.map(() => '?').join(', ')
  const values = keys.map((key) => data[key])
  return {
    sql: `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`,
    values
  }
}

function buildUpdateSql(table, data) {
  const keys = Object.keys(data)
  const setters = keys.map((key) => `${key} = ?`).join(', ')
  const values = keys.map((key) => data[key])
  return {
    sql: `UPDATE ${table} SET ${setters} WHERE id = ?`,
    values
  }
}

export function createCrudRouter({
  table,
  listOrderBy = 'id DESC',
  createFields = [],
  updateFields = [],
  beforeCreate,
  beforeUpdate,
  afterList,
  afterItem
}) {
  const router = express.Router()

  router.get('/', async (req, res, next) => {
    try {
      const page = Math.max(Number(req.query.page || 1), 1)
      const pageSize = Math.max(Number(req.query.pageSize || 10), 1)
      const offset = (page - 1) * pageSize
      const keyword = String(req.query.keyword || '').trim()

      let where = ''
      const params = []
      if (keyword && createFields.length > 0) {
        const searchable = createFields[0]
        where = `WHERE ${searchable} LIKE ?`
        params.push(`%${keyword}%`)
      }

      const countRows = await req.app.locals.db.query(`SELECT COUNT(*) AS total FROM ${table} ${where}`, params)
      const rows = await req.app.locals.db.query(
        `SELECT * FROM ${table} ${where} ORDER BY ${listOrderBy} LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      )

      const data = afterList ? afterList(rows) : rows
      res.json({ code: 0, message: 'success', data: { list: data, total: countRows[0].total, page, pageSize } })
    } catch (error) {
      next(error)
    }
  })

  router.get('/:id', async (req, res, next) => {
    try {
      const rows = await req.app.locals.db.query(`SELECT * FROM ${table} WHERE id = ? LIMIT 1`, [req.params.id])
      const item = afterItem ? afterItem(rows[0] || null) : (rows[0] || null)
      res.json({ code: 0, message: 'success', data: item })
    } catch (error) {
      next(error)
    }
  })

  router.post('/', async (req, res, next) => {
    try {
      const base = pick(req.body, createFields)
      const payload = beforeCreate ? await beforeCreate(base, req) : base
      const { sql, values } = buildInsertSql(table, payload)
      const result = await req.app.locals.db.query(sql, values)
      res.status(201).json({ code: 0, message: 'created', data: { id: result.insertId } })
    } catch (error) {
      next(error)
    }
  })

  router.put('/:id', async (req, res, next) => {
    try {
      const base = pick(req.body, updateFields)
      const payload = beforeUpdate ? await beforeUpdate(base, req) : base
      const { sql, values } = buildUpdateSql(table, payload)
      await req.app.locals.db.query(sql, [...values, req.params.id])
      res.json({ code: 0, message: 'updated', data: { id: Number(req.params.id) } })
    } catch (error) {
      next(error)
    }
  })

  router.delete('/:id', async (req, res, next) => {
    try {
      await req.app.locals.db.query(`DELETE FROM ${table} WHERE id = ?`, [req.params.id])
      res.json({ code: 0, message: 'deleted', data: { id: Number(req.params.id) } })
    } catch (error) {
      next(error)
    }
  })

  return router
}
