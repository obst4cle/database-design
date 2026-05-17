import { useEffect, useState } from 'react'
import http from '../api/http'

export default function ResourcePage({ title, apiPath, columns }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadData() {
      setLoading(true)
      setError('')
      try {
        const response = await http.get(apiPath, { params: { page: 1, pageSize: 8 } })
        if (!ignore) {
          setRows(response.data?.list || [])
        }
      } catch (requestError) {
        if (!ignore) setError(requestError.message)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadData()
    return () => {
      ignore = true
    }
  }, [apiPath])

  return (
    <div className="page-card">
      <div className="page-head">
        <h3>{title}</h3>
      </div>

      {loading ? <div className="empty-state">加载中...</div> : null}
      {error ? <div className="empty-state error">{error}</div> : null}

      {!loading && !error ? (
        <div className="table-shell">
          <div className="table-header" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
            {columns.map((column) => <span key={column.key || column}>{column.label || column}</span>)}
          </div>
          {rows.length === 0 ? (
            <div className="table-row table-empty"><span>暂无数据</span></div>
          ) : (
            rows.map((row) => (
              <div
                className="table-row"
                key={row.id}
                style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
              >
                {columns.map((column) => {
                  const key = column.key || column
                  return <span key={key}>{String(row[key] ?? row[String(key).toLowerCase()] ?? '--')}</span>
                })}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
