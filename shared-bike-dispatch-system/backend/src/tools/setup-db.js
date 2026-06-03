import fs from 'fs'
import path from 'path'
import mysql from 'mysql2/promise'
import { config } from '../config.js'

async function main() {
  const projectRoot = path.resolve(process.cwd(), '..')
  const schemaPath = path.join(projectRoot, 'sql', 'schema.sql')

  if (!fs.existsSync(schemaPath)) {
    console.error('schema.sql not found at', schemaPath)
    process.exit(1)
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf8')
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true
  })

  try {
    await connection.query(schemaSql)
    console.log('Database schema and demo data applied.')
  } catch (error) {
    console.error('Error applying schema.sql:', error)
    process.exit(1)
  } finally {
    await connection.end()
  }
}

main()
