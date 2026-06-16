import { useEffect, useMemo, useState } from 'react'
import http from '../api/http'
import { AppShell, AuthGuard } from '../components/Layout'
import CrudManagerPage from '../components/CrudManagerPage'

const taskStatusOptions = [
  { value: 'pending', label: '待指派' },
  { value: 'doing', label: '调拨中' },
  { value: 'done', label: '已完成' }
]

const taskTypeOptions = [
  { value: 'relocation', label: '运力调拨' }
]

function formatTaskStatus(value) {
  return taskStatusOptions.find((o) => o.value === value)?.label || String(value)
}

function formatTaskType(value) {
  return taskTypeOptions.find((o) => o.value === value)?.label || String(value)
}

function extractList(response) {
  return response?.data?.list || response?.data?.data?.list || []
}

function toDateTimeValue(value) {
  if (!value) return null
  return String(value).replace('T', ' ').slice(0, 19)
}

const taskColumns = [
  { key: 'task_no', label: '工单号' },
  { key: 'staff_id', label: '负责人' },
  { key: 'from_station_id', label: '来源站' },
  { key: 'to_station_id', label: '目标站' },
  { key: 'task_type', label: '类型' },
  { key: 'task_status', label: '状态' },
  { key: 'planned_at', label: '计划时间' }
]

export default function DispatchTasksPage() {
  const [stations, setStations] = useState([])
  const [staffs, setStaffs] = useState([])

  useEffect(() => {
    let ignore = false
    Promise.all([
      http.get('/stations', { params: { page: 1, pageSize: 100 } }),
      http.get('/staffs', { params: { page: 1, pageSize: 100 } })
    ]).then(([stationRes, staffRes]) => {
      if (ignore) return
      setStations(extractList(stationRes))
      setStaffs(extractList(staffRes))
    }).catch(() => {})
    return () => { ignore = true }
  }, [])

  const stationOptions = useMemo(() => stations.map((s) => ({
    value: String(s.id),
    label: s.station_name || s.station_code || `站点 #${s.id}`
  })), [stations])

  const staffOptions = useMemo(() => staffs.map((s) => ({
    value: String(s.id),
    label: `${s.staff_name}（${s.staff_code}）`
  })), [staffs])

  const stationNameById = useMemo(() => stations.reduce((m, s) => { m[String(s.id)] = s.station_name; return m }, {}), [stations])
  const staffNameById = useMemo(() => staffs.reduce((m, s) => { m[String(s.id)] = s.staff_name; return m }, {}), [staffs])

  const taskFields = useMemo(() => [
    { name: 'task_no', label: '工单号', required: true },
    { name: 'staff_id', label: '负责人', type: 'select', required: true, options: staffOptions },
    { name: 'from_station_id', label: '来源站', type: 'select', required: true, options: stationOptions },
    { name: 'to_station_id', label: '目标站', type: 'select', required: true, options: stationOptions },
    { name: 'equipment_ids', label: '设备 ID 列表（JSON）', type: 'textarea', rows: 1, required: true },
    { name: 'task_type', label: '类型', type: 'select', required: true, options: taskTypeOptions },
    { name: 'planned_at', label: '计划时间', type: 'datetime-local', required: true },
    { name: 'started_at', label: '开始时间', type: 'datetime-local' },
    { name: 'finished_at', label: '完成时间', type: 'datetime-local' },
    { name: 'task_status', label: '状态', type: 'select', required: true, options: taskStatusOptions },
    { name: 'remark', label: '备注', type: 'textarea', rows: 2 }
  ], [staffOptions, stationOptions])

  return (
    <AuthGuard>
      <AppShell title="调度工单">
        <CrudManagerPage
          title="调度工单列表"
          apiPath="/dispatch-tasks"
          columns={taskColumns}
          fields={taskFields}
          createLabel="新增工单"
          helperText="管理运力调拨工单。也可在「调度与售后」页面通过智能建议一键生成工单。"
          defaultValues={{ task_type: 'relocation', task_status: 'pending', equipment_ids: '[]' }}
          mapRecordToForm={(record) => ({
            task_no: record.task_no ?? '',
            staff_id: record.staff_id != null ? String(record.staff_id) : '',
            from_station_id: record.from_station_id != null ? String(record.from_station_id) : '',
            to_station_id: record.to_station_id != null ? String(record.to_station_id) : '',
            equipment_ids: typeof record.equipment_ids === 'string' ? record.equipment_ids : JSON.stringify(record.equipment_ids ?? []),
            task_type: record.task_type ?? 'relocation',
            planned_at: record.planned_at ?? '',
            started_at: record.started_at ?? '',
            finished_at: record.finished_at ?? '',
            task_status: record.task_status ?? 'pending',
            remark: record.remark ?? ''
          })}
          buildCreatePayload={(formValues) => ({
            task_no: formValues.task_no,
            staff_id: Number(formValues.staff_id),
            from_station_id: Number(formValues.from_station_id),
            to_station_id: Number(formValues.to_station_id),
            equipment_ids: formValues.equipment_ids,
            task_type: formValues.task_type,
            planned_at: toDateTimeValue(formValues.planned_at),
            started_at: toDateTimeValue(formValues.started_at),
            finished_at: toDateTimeValue(formValues.finished_at),
            task_status: formValues.task_status,
            remark: formValues.remark || null
          })}
          buildUpdatePayload={(formValues) => ({
            staff_id: Number(formValues.staff_id),
            from_station_id: Number(formValues.from_station_id),
            to_station_id: Number(formValues.to_station_id),
            equipment_ids: formValues.equipment_ids,
            task_type: formValues.task_type,
            planned_at: toDateTimeValue(formValues.planned_at),
            started_at: toDateTimeValue(formValues.started_at),
            finished_at: toDateTimeValue(formValues.finished_at),
            task_status: formValues.task_status,
            remark: formValues.remark || null
          })}
          formatValue={(value, row, key) => {
            if (value === null || value === undefined || value === '') return '--'
            if (key === 'staff_id') return staffNameById[String(value)] || `人员 #${value}`
            if (key === 'from_station_id' || key === 'to_station_id') return stationNameById[String(value)] || `站点 #${value}`
            if (key === 'task_type') return formatTaskType(value)
            if (key === 'task_status') return formatTaskStatus(value)
            if (key === 'planned_at') return String(value).replace('T', ' ').slice(0, 16)
            return String(value)
          }}
        />
      </AppShell>
    </AuthGuard>
  )
}
