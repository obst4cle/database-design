import { useEffect, useMemo, useState } from 'react'
import http from '../api/http'
import { AppShell, AuthGuard } from '../components/Layout'
import CrudManagerPage from '../components/CrudManagerPage'

const repairStatusOptions = [
  { value: 'reported', label: '已提交' },
  { value: 'processing', label: '处理中' },
  { value: 'done', label: '已修复' }
]

const faultTypeOptions = [
  { value: 'vehicle_fault', label: '车辆故障' },
  { value: 'brake_fault', label: '刹车故障' },
  { value: 'tire_flat', label: '轮胎漏气' },
  { value: 'lock_fault', label: '锁具故障' },
  { value: 'battery_low', label: '电量故障' }
]

function formatRepairStatus(value) {
  return repairStatusOptions.find((o) => o.value === value)?.label || String(value)
}

function formatFaultType(value) {
  return faultTypeOptions.find((o) => o.value === value)?.label || String(value)
}

function extractList(response) {
  return response?.data?.list || response?.data?.data?.list || []
}

function toDateTimeValue(value) {
  if (!value) return null
  return String(value).replace('T', ' ').slice(0, 19)
}

function toNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

const logColumns = [
  { key: 'equipment_id', label: '设备' },
  { key: 'staff_id', label: '维修人员' },
  { key: 'fault_type', label: '故障类型' },
  { key: 'repair_status', label: '维修状态' },
  { key: 'reported_at', label: '报修时间' },
  { key: 'handled_at', label: '处理时间' }
]

export default function MaintenanceLogsPage() {
  const [equipments, setEquipments] = useState([])
  const [staffs, setStaffs] = useState([])

  useEffect(() => {
    let ignore = false
    Promise.all([
      http.get('/equipments', { params: { page: 1, pageSize: 200 } }),
      http.get('/staffs', { params: { page: 1, pageSize: 100 } })
    ]).then(([eqRes, stRes]) => {
      if (ignore) return
      setEquipments(extractList(eqRes))
      setStaffs(extractList(stRes))
    }).catch(() => {})
    return () => { ignore = true }
  }, [])

  const equipOptions = useMemo(() => equipments.map((e) => ({
    value: String(e.id),
    label: e.equipment_code
  })), [equipments])

  const staffOptions = useMemo(() => staffs.map((s) => ({
    value: String(s.id),
    label: `${s.staff_name}（${s.staff_code}）`
  })), [staffs])

  const equipCodeById = useMemo(() => equipments.reduce((m, e) => { m[String(e.id)] = e.equipment_code; return m }, {}), [equipments])
  const staffNameById = useMemo(() => staffs.reduce((m, s) => { m[String(s.id)] = s.staff_name; return m }, {}), [staffs])

  const logFields = useMemo(() => [
    { name: 'equipment_id', label: '设备', type: 'select', required: true, options: equipOptions },
    { name: 'staff_id', label: '维修人员', type: 'select', options: [{ value: '', label: '待指派' }, ...staffOptions] },
    { name: 'fault_type', label: '故障类型', type: 'select', required: true, options: faultTypeOptions },
    { name: 'fault_description', label: '故障描述', type: 'textarea', rows: 2 },
    { name: 'reported_at', label: '报修时间', type: 'datetime-local' },
    { name: 'repair_status', label: '维修状态', type: 'select', required: true, options: repairStatusOptions },
    { name: 'handled_at', label: '处理时间', type: 'datetime-local' },
    { name: 'repair_result', label: '维修结果', type: 'textarea', rows: 2 }
  ], [equipOptions, staffOptions])

  return (
    <AuthGuard>
      <AppShell title="维修记录">
        <CrudManagerPage
          title="维修记录列表"
          apiPath="/maintenance-logs"
          columns={logColumns}
          fields={logFields}
          createLabel="新增报修"
          helperText="管理设备报修与维修流程。新增报修会触发数据库触发器将设备状态置为故障。"
          defaultValues={{ repair_status: 'reported', fault_type: 'vehicle_fault' }}
          mapRecordToForm={(record) => ({
            equipment_id: record.equipment_id != null ? String(record.equipment_id) : '',
            staff_id: record.staff_id != null ? String(record.staff_id) : '',
            fault_type: record.fault_type ?? 'vehicle_fault',
            fault_description: record.fault_description ?? '',
            reported_at: record.reported_at ?? '',
            repair_status: record.repair_status ?? 'reported',
            handled_at: record.handled_at ?? '',
            repair_result: record.repair_result ?? ''
          })}
          buildCreatePayload={(formValues) => ({
            equipment_id: Number(formValues.equipment_id),
            staff_id: toNumber(formValues.staff_id),
            fault_type: formValues.fault_type,
            fault_description: formValues.fault_description || null,
            reported_at: toDateTimeValue(formValues.reported_at),
            repair_status: formValues.repair_status,
            handled_at: toDateTimeValue(formValues.handled_at),
            repair_result: formValues.repair_result || null
          })}
          buildUpdatePayload={(formValues) => ({
            staff_id: toNumber(formValues.staff_id),
            fault_type: formValues.fault_type,
            fault_description: formValues.fault_description || null,
            reported_at: toDateTimeValue(formValues.reported_at),
            repair_status: formValues.repair_status,
            handled_at: toDateTimeValue(formValues.handled_at),
            repair_result: formValues.repair_result || null
          })}
          formatValue={(value, row, key) => {
            if (value === null || value === undefined || value === '') return '--'
            if (key === 'equipment_id') return equipCodeById[String(value)] || `设备 #${value}`
            if (key === 'staff_id') return staffNameById[String(value)] || `人员 #${value}`
            if (key === 'fault_type') return formatFaultType(value)
            if (key === 'repair_status') return formatRepairStatus(value)
            if (key === 'reported_at' || key === 'handled_at') return String(value).replace('T', ' ').slice(0, 16)
            return String(value)
          }}
        />
      </AppShell>
    </AuthGuard>
  )
}
