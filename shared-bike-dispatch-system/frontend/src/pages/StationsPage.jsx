import { AppShell, AuthGuard } from '../components/Layout'
import CrudManagerPage from '../components/CrudManagerPage'

const stationFields = [
  { name: 'station_code', label: '站点编号', required: true },
  { name: 'station_name', label: '站点名称', required: true },
  { name: 'address', label: '详细地址', type: 'textarea', rows: 2 },
  { name: 'longitude', label: '经度', type: 'number', step: 'any', required: true },
  { name: 'latitude', label: '纬度', type: 'number', step: 'any', required: true },
  { name: 'max_capacity', label: '最大容量', type: 'number', required: true },
  { name: 'available_slots', label: '可用空位', type: 'number', required: true },
  {
    name: 'station_status',
    label: '站点状态',
    type: 'select',
    required: true,
    options: [
      { value: 'normal', label: 'normal' },
      { value: 'busy', label: 'busy' },
      { value: 'closed', label: 'closed' }
    ]
  }
]

const stationColumns = [
  { key: 'station_name', label: '站点名称' },
  { key: 'station_code', label: '站点编号' },
  { key: 'longitude', label: '经度' },
  { key: 'latitude', label: '纬度' },
  { key: 'available_slots', label: '空位' },
  { key: 'station_status', label: '状态' }
]

export default function StationsPage() {
  return (
    <AuthGuard>
      <AppShell title="网点管理" subtitle="查看并维护站点经纬度、容量和空闲位。">
        <CrudManagerPage
          title="网点列表"
          description="支持新增、编辑和删除站点，提交时自动把经纬度转换为位置字段。"
          apiPath="/stations"
          columns={stationColumns}
          fields={stationFields}
          defaultValues={{ station_status: 'normal', max_capacity: 0, available_slots: 0 }}
          mapRecordToForm={(record) => ({
            station_code: record.station_code ?? '',
            station_name: record.station_name ?? '',
            address: record.address ?? '',
            longitude: record.longitude ?? '',
            latitude: record.latitude ?? '',
            max_capacity: record.max_capacity ?? 0,
            available_slots: record.available_slots ?? 0,
            station_status: record.station_status ?? 'normal'
          })}
          buildCreatePayload={(formValues) => ({
            ...formValues,
            longitude: Number(formValues.longitude),
            latitude: Number(formValues.latitude),
            max_capacity: Number(formValues.max_capacity),
            available_slots: Number(formValues.available_slots)
          })}
          buildUpdatePayload={(formValues) => ({
            ...formValues,
            longitude: Number(formValues.longitude),
            latitude: Number(formValues.latitude),
            max_capacity: Number(formValues.max_capacity),
            available_slots: Number(formValues.available_slots)
          })}
          formatValue={(value, row, key) => {
            if (value === null || value === undefined || value === '') return '--'
            if (key === 'longitude' || key === 'latitude') return Number(value).toFixed(6)
            return String(value)
          }}
        />
      </AppShell>
    </AuthGuard>
  )
}
