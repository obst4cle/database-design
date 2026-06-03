import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import http from '../api/http'

function toReadableLabel(key) {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function normalizeColumns(columns) {
  return columns.map((column) => {
    if (typeof column === 'string') {
      return { key: column, label: toReadableLabel(column) }
    }
    return { label: toReadableLabel(column.key), ...column }
  })
}

function formatInputValue(field, value) {
  if (value === null || value === undefined) return ''
  if (field.type === 'datetime-local' && typeof value === 'string') {
    return value.slice(0, 16)
  }
  return String(value)
}

export default function CrudManagerPage({
  title,
  apiPath,
  columns,
  fields,
  defaultValues = {},
  createLabel = '新增',
  mapRecordToForm = (record) => record,
  buildCreatePayload = (formValues) => formValues,
  buildUpdatePayload = (formValues) => formValues,
  formatValue,
  rowActions,
  toolbarActions,
  helperText,
  allowCreate = true,
  allowDelete = true
}) {
  const tableColumns = useMemo(() => normalizeColumns(columns), [columns])
  const tableGridTemplate = useMemo(
    () => `${tableColumns.map(() => 'minmax(120px, 1fr)').join(' ')} minmax(220px, auto)`,
    [tableColumns]
  )
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const [formValues, setFormValues] = useState(defaultValues)
  const [saving, setSaving] = useState(false)

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const response = await http.get(apiPath, { params: { page: 1, pageSize: 20 } })
      setRows(response.data?.list || [])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [apiPath])

  useEffect(() => {
    if (!modalOpen) return undefined
    document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [modalOpen])

  function openCreateModal() {
    setEditingRow(null)
    setFormValues({ ...defaultValues })
    setModalOpen(true)
  }

  function openEditModal(record) {
    setEditingRow(record)
    setFormValues({ ...defaultValues, ...mapRecordToForm(record) })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingRow(null)
  }

  function updateField(name, value) {
    setFormValues((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = editingRow
        ? buildUpdatePayload(formValues, editingRow)
        : buildCreatePayload(formValues)

      if (editingRow) {
        await http.put(`${apiPath}/${editingRow.id}`, payload)
      } else {
        await http.post(apiPath, payload)
      }
      closeModal()
      await loadData()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(record) {
    if (!window.confirm(`确认删除记录 #${record.id} 吗？`)) return
    setError('')
    try {
      await http.delete(`${apiPath}/${record.id}`)
      await loadData()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  function renderField(field) {
    const value = formValues[field.name] ?? ''
    if (field.type === 'select') {
      return (
        <select
          value={value}
          onChange={(event) => updateField(field.name, event.target.value)}
          required={field.required}
        >
          <option value="">请选择</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      )
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          rows={field.rows || 3}
          value={value}
          placeholder={field.placeholder}
          onChange={(event) => updateField(field.name, event.target.value)}
          required={field.required}
        />
      )
    }

    return (
      <input
        type={field.type || 'text'}
        step={field.step}
        value={formatInputValue(field, value)}
        placeholder={field.placeholder}
        onChange={(event) => updateField(field.name, event.target.value)}
        required={field.required}
      />
    )
  }

  return (
    <div className="page-card crud-card">
      <div className="page-head crud-head">
        <h3>{title}</h3>
        <div className="toolbar-actions">
          {toolbarActions ? toolbarActions({ reload: loadData }) : null}
          {allowCreate ? (
            <button className="primary-btn" type="button" onClick={openCreateModal}>{createLabel}</button>
          ) : null}
        </div>
      </div>

      {helperText ? <p className="status-text">{helperText}</p> : null}
      {loading ? <div className="empty-state">加载中...</div> : null}
      {error ? <div className="empty-state error">{error}</div> : null}

      {!loading && !error ? (
        <div className="table-shell">
          <div className="table-header" style={{ gridTemplateColumns: tableGridTemplate }}>
            {tableColumns.map((column) => <span key={column.key}>{column.label}</span>)}
            <span>操作</span>
          </div>
          {rows.length === 0 ? (
            <div className="table-row table-empty"><span>暂无数据</span></div>
          ) : (
            rows.map((row) => (
              <div
                className="table-row"
                key={row.id}
                style={{ gridTemplateColumns: tableGridTemplate }}
              >
                {tableColumns.map((column) => (
                  <span key={column.key}>
                    {column.render ? column.render(row) : (formatValue ? formatValue(row[column.key], row, column.key) : String(row[column.key] ?? '--'))}
                  </span>
                ))}
                <span className="action-bar">
                  {rowActions ? rowActions(row, { edit: () => openEditModal(row), remove: () => handleDelete(row), reload: loadData }) : null}
                  <button className="inline-btn primary" type="button" onClick={() => openEditModal(row)}>编辑</button>
                  {allowDelete ? (
                    <button className="inline-btn warn" type="button" onClick={() => handleDelete(row)}>删除</button>
                  ) : null}
                </span>
              </div>
            ))
          )}
        </div>
      ) : null}

      {modalOpen ? createPortal(
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h4>{editingRow ? '编辑记录' : '新增记录'}</h4>
              <button className="ghost-btn" type="button" onClick={closeModal}>关闭</button>
            </div>

            <form className="crud-form" onSubmit={handleSubmit}>
              {fields.map((field) => (
                <label key={field.name} className={`crud-field${field.type === 'textarea' ? ' wide' : ''}`}>
                  <span>{field.label || toReadableLabel(field.name)}</span>
                  {renderField(field)}
                </label>
              ))}
              <div className="modal-actions">
                <button className="primary-btn" type="submit" disabled={saving}>
                  {saving ? '保存中...' : '保存'}
                </button>
                <button className="ghost-btn" type="button" onClick={closeModal}>取消</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  )
}
