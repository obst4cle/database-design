import fs from 'fs'
import path from 'path'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import { config } from '../config.js'

async function main() {
  const projectRoot = path.resolve(process.cwd(), '..')
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
    console.log('Applying schema...')
    const statements = schemaSql
      .split(/;\s*\n/)
      .map((statement) => statement.trim())
      .filter(Boolean)

    fs.appendFileSync(appliedPath, `\n-- Applied schema at ${new Date().toISOString()}\n`)

    for (const statement of statements) {
      try {
        await conn.query(statement)
        fs.appendFileSync(appliedPath, `${statement};\n`)
      } catch (error) {
        if (error && ['ER_DUP_KEYNAME', 'ER_TABLE_EXISTS_ERROR', 'ER_DUP_FIELDNAME'].includes(error.code)) {
          fs.appendFileSync(appliedPath, `-- Ignored ${error.code}: ${error.message}\n`)
          continue
        }
        throw error
      }
    }

    const users = [
      { username: 'alice', password: 'password123', phone: '13800138000', real_name: 'Alice', balance: 80 },
      { username: 'bob', password: 'password123', phone: '13800138001', real_name: 'Bob', balance: 66 },
      { username: 'charlie', password: 'password123', phone: '13800138002', real_name: 'Charlie', balance: 120 }
    ]

    for (const user of users) {
      const hash = await bcrypt.hash(user.password, 10)
      await conn.execute(
        `INSERT INTO users (rank_id, username, password_hash, phone, real_name, balance)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE real_name = VALUES(real_name), balance = VALUES(balance)`,
        [1, user.username, hash, user.phone, user.real_name, user.balance]
      )
    }

    await conn.execute(
      `INSERT INTO staffs (staff_code, staff_name, phone, district, job_title, staff_status, hired_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE staff_name = VALUES(staff_name), staff_status = VALUES(staff_status)`,
      ['SF001', '调度员张伟', '13900139000', '中心城区', 'dispatcher', 'active', '2025-01-01']
    )

    const stations = [
      ['ST001', '中心广场站', '人民路 1 号', 121.473701, 31.230416, 24, 6],
      ['ST002', '软件园站', '创新大道 8 号', 121.481522, 31.237495, 20, 16]
    ]

    for (const station of stations) {
      await conn.execute(
        `INSERT INTO stations (station_code, station_name, address, location, max_capacity, available_slots)
         VALUES (?, ?, ?, ST_GeomFromText(?), ?, ?)
         ON DUPLICATE KEY UPDATE station_name = VALUES(station_name), address = VALUES(address), max_capacity = VALUES(max_capacity), available_slots = VALUES(available_slots)`,
        [station[0], station[1], station[2], `POINT(${station[3]} ${station[4]})`, station[5], station[6]]
      )
    }

    const equipmentSeeds = [
      ['ST001', 'EQ001', 'bike', 92, 'v1', 'idle'],
      ['ST001', 'EQ002', 'bike', 78, 'v1', 'idle'],
      ['ST001', 'EQ003', 'bike', 55, 'v1', 'idle'],
      ['ST002', 'EQ004', 'bike', 88, 'v1', 'idle']
    ]

    for (const equipment of equipmentSeeds) {
      await conn.execute(
        `INSERT INTO equipments (station_id, equipment_code, equipment_type, battery_level, hardware_version, equipment_status)
         VALUES ((SELECT id FROM stations WHERE station_code = ? LIMIT 1), ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE battery_level = VALUES(battery_level), equipment_status = VALUES(equipment_status)`,
        equipment
      )
    }

    await conn.execute(
      `INSERT INTO maintenance_logs (equipment_id, staff_id, fault_type, repair_status, repair_result)
       VALUES (
         (SELECT id FROM equipments WHERE equipment_code = 'EQ004' LIMIT 1),
         (SELECT id FROM staffs WHERE staff_code = 'SF001' LIMIT 1),
         'battery',
         'reported',
         '待处理'
       )`
    ).catch(() => {})

    console.log('Database setup and seed completed.')
  } catch (error) {
    console.error('Error applying schema or seeding:', error)
    process.exit(1)
  } finally {
    await conn.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
