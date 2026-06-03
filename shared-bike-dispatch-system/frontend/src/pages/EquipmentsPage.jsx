import { useEffect, useMemo, useState } from 'react'
import http from '../api/http'
import { AppShell, AuthGuard } from '../components/Layout'
import CrudManagerPage from '../components/CrudManagerPage'

const statusOptions = [
  { value: 'idle', label: '空闲' },
  { value: 'in_use', label: '使用中' },
  { value: 'maintenance', label: '维修中' },
  { value: 'faulty', label: '故障中' }
]

const typeOptions = [
  { value: 'bike', label: '共享单车' }
]

function formatEquipmentStatus(value) {
  return statusOptions.find((item) => item.value === value)?.label || String(value ?? '--')
}

function formatEquipmentType(value) {
  return typeOptions.find((item) => item.value === value)?.label || (value ? '其他设备' : '--')
}

function extractList(response) {
  return response?.data?.list || response?.data?.data?.list || []
}

const equipmentColumns = [
  { key: 'equipment_code', label: '设备编号' },
  { key: 'equipment_type', label: '设备类型' },
  { key: 'station_name', label: '归属站点' },
  { key: 'hardware_version', label: '硬件版本' },
  { key: 'equipment_status', label: '状态' }
]

export default function EquipmentsPage() {
  const [stations, setStations] = useState([])

  useEffect(() => {
    let ignore = false
    async function loadStations() {
      try {
        const response = await http.get('/stations', { params: { page: 1, pageSize: 100 } })
        if (!ignore) setStations(extractList(response))
      } catch (error) {
        if (!ignore) setStations([])
      }
    }
    loadStations()
    return () => {
      ignore = true
    }
  }, [])

  const stationOptions = useMemo(
    () => stations.map((station) => ({
      value: String(station.id),
      label: `${station.station_name || station.station_code || `站点 #${station.id}`}`
    })),
    [stations]
  )

  const equipmentFields = useMemo(() => [
    { name: 'equipment_code', label: '设备编号', required: true },
    { name: 'equipment_type', label: '设备类型', type: 'select', required: true, options: typeOptions },
    { name: 'hardware_version', label: '硬件版本', required: true },
    {
      name: 'station_id',
      label: '归属站点',
      type: 'select',
      options: [{ value: '', label: '无（骑行中 / 未分配）' }, ...stationOptions]
    },
    { name: 'equipment_status', label: '状态', type: 'select', required: true, options: statusOptions },
    { name: 'last_maintenance_at', label: '上次维护时间', type: 'datetime-local' }
  ], [stationOptions])

  return (
    <AuthGuard>
      <AppShell title="设备">
        <CrudManagerPage
          title="设备列表"
          apiPath="/equipments"
          columns={equipmentColumns}
          fields={equipmentFields}
          createLabel="新增设备"
          defaultValues={{ equipment_type: 'bike', equipment_status: 'idle', hardware_version: 'v1', station_id: '' }}
          helperText="可手动调整设备的归属站点与状态，方便调试。空位会根据停靠在站点的车辆数自动计算。"
          mapRecordToForm={(record) => ({
            equipment_code: record.equipment_code ?? '',
            equipment_type: record.equipment_type ?? 'bike',
            hardware_version: record.hardware_version ?? '',
            station_id: record.station_id != null ? String(record.station_id) : '',
            equipment_status: record.equipment_status ?? 'idle',
            last_maintenance_at: record.last_maintenance_at ?? ''
          })}
          buildCreatePayload={(formValues) => ({
            equipment_code: formValues.equipment_code,
            equipment_type: formValues.equipment_type,
            hardware_version: formValues.hardware_version,
            station_id: formValues.station_id ? Number(formValues.station_id) : null,
            equipment_status: formValues.equipment_status,
            last_maintenance_at: formValues.last_maintenance_at
              ? String(formValues.last_maintenance_at).replace('T', ' ').slice(0, 19)
              : null
          })}
          buildUpdatePayload={(formValues) => ({
            equipment_code: formValues.equipment_code,
            equipment_type: formValues.equipment_type,
            hardware_version: formValues.hardware_version,
            station_id: formValues.station_id ? Number(formValues.station_id) : null,
            equipment_status: formValues.equipment_status,
            last_maintenance_at: formValues.last_maintenance_at
              ? String(formValues.last_maintenance_at).replace('T', ' ').slice(0, 19)
              : null
          })}
          formatValue={(value, row, key) => {
            if (key === 'station_name') {
              if (!row.station_id) return '骑行中 / 未分配'
              return value || `站点 #${row.station_id}`
            }
            if (value === null || value === undefined || value === '') return '--'
            if (key === 'equipment_type') return formatEquipmentType(value)
            if (key === 'equipment_status') return formatEquipmentStatus(value)
            return String(value)
          }}
        />
      </AppShell>
    </AuthGuard>
  )
}
