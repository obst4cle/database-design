import { useCallback, useEffect, useState } from 'react'
import http from '../api/http'

export default function ResourcePage({ title, apiPath, columns, pageSize = 8, rowActions, formatValue, toolbarActions, helperText }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await http.get(apiPath, { params: { page: 1, pageSize } })
      setRows(response.data?.list || [])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [apiPath, pageSize])

  useEffect(() => {
    loadData()
  }, [loadData])

  const visibleColumns = rowActions ? [...columns, { key: '__actions', label: '操作' }] : columns

  return (
    <div className="page-card">
      <div className="page-head">
        <h3>{title}</h3>
        {toolbarActions ? <div className="toolbar-actions">{toolbarActions({ reload: loadData })}</div> : null}
      </div>

      {helperText ? <p className="status-text">{helperText}</p> : null}
      {loading ? <div className="empty-state">加载中...</div> : null}
      {error ? <div className="empty-state error">{error}</div> : null}

      {!loading && !error ? (
        <div className="table-shell">
          <div className="table-header" style={{ gridTemplateColumns: `repeat(${visibleColumns.length}, minmax(0, 1fr))` }}>
            {visibleColumns.map((column) => <span key={column.key || column}>{column.label || column}</span>)}
          </div>
          {rows.length === 0 ? (
            <div className="table-row table-empty"><span>暂无数据</span></div>
          ) : (
            rows.map((row) => (
              <div
                className="table-row"
                key={row.id}
                style={{ gridTemplateColumns: `repeat(${visibleColumns.length}, minmax(0, 1fr))` }}
              >
                {columns.map((column) => {
                  const key = column.key || column
                  const value = row[key] ?? row[String(key).toLowerCase()]
                  return <span key={key}>{formatValue ? formatValue(value, row, key) : String(value ?? '--')}</span>
                })}
                {rowActions ? (
                  <span className="action-bar">
                    {rowActions(row, { reload: loadData })}
                  </span>
                ) : null}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
