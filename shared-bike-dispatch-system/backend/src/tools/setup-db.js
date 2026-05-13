import fs from 'fs'
import path from 'path'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import { config } from '../config.js'

async function main() {
  const projectRoot = path.resolve(process.cwd(), '..') // backend is in backend/, project root is parent
  const schemaPath = path.join(projectRoot, 'sql', 'schema.sql')
  const appliedPath = path.join(projectRoot, 'sql', 'applied.sql')

  if (!fs.existsSync(schemaPath)) {
    console.error('schema.sql not found at', schemaPath)
    process.exit(1)
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf8')

  const conn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true
  })

  try {
    console.log('Applying schema (statement by statement)...')
    const statements = schemaSql
      .split(/;\s*\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    fs.appendFileSync(appliedPath, `\n-- Applied schema at ${new Date().toISOString()}\n`)

    for (const stmt of statements) {
      try {
        await conn.query(stmt)
        fs.appendFileSync(appliedPath, stmt + ';\n')
      } catch (e) {
        // ignore duplicate key/index errors and continue
        if (e && (e.code === 'ER_DUP_KEYNAME' || e.code === 'ER_TABLE_EXISTS_ERROR')) {
          console.warn('Ignored DB error:', e.code, e.sqlMessage || e.message)
          fs.appendFileSync(appliedPath, `-- Ignored error ${e.code}: ${e.message}\n`)
          continue
        }
        throw e
      }
    }

    // Seed sample users
    const samples = [
      { username: 'alice', password: 'password123', phone: '13800138000', real_name: 'Alice' },
      { username: 'bob', password: 'password123', phone: '13800138001', real_name: 'Bob' },
      { username: 'charlie', password: 'password123', phone: '13800138002', real_name: 'Charlie' }
    ]

    for (const u of samples) {
      const hash = await bcrypt.hash(u.password, 10)
      const sql = `INSERT INTO users (rank_id, username, password_hash, phone, real_name) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE username = username`;
      const params = [1, u.username, hash, u.phone, u.real_name]
      await conn.execute(sql, params)
      fs.appendFileSync(appliedPath, `-- Inserted user ${u.username} at ${new Date().toISOString()}\n`)
      fs.appendFileSync(appliedPath, sql + ' -- params: ' + JSON.stringify(params) + '\n')
    }

    // Seed a couple of stations and equipments for demo
    const stationSql = `INSERT INTO stations (station_code, station_name, address, location, max_capacity, available_slots) VALUES (?, ?, ?, POINT(0,0), ?, ?) ON DUPLICATE KEY UPDATE station_name = station_name`;
    const stationParams = ['ST001', '中心站点', '示例地址 1', 20, 10]
    await conn.execute(stationSql, stationParams)
    fs.appendFileSync(appliedPath, `-- Inserted station ST001\n`)
    fs.appendFileSync(appliedPath, stationSql + ' -- params: ' + JSON.stringify(stationParams) + '\n')

    const equipSql = `INSERT INTO equipments (station_id, equipment_code, equipment_type, battery_level, hardware_version) VALUES ((SELECT id FROM stations WHERE station_code = ? LIMIT 1), ?, ?, ?, ?) ON DUPLICATE KEY UPDATE equipment_code = equipment_code`;
    const equipParams = ['ST001', 'EQ001', 'bike', 90, 'v1']
    await conn.execute(equipSql, equipParams)
    fs.appendFileSync(appliedPath, `-- Inserted equipment EQ001\n`)
    fs.appendFileSync(appliedPath, equipSql + ' -- params: ' + JSON.stringify(equipParams) + '\n')

    console.log('Database setup and seeding complete. Applied SQL saved to', appliedPath)
  } catch (err) {
    console.error('Error applying schema or seeding:', err)
    process.exit(1)
  } finally {
    await conn.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
