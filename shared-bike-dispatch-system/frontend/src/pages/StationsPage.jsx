import { AppShell, AuthGuard } from '../components/Layout'
import CrudManagerPage from '../components/CrudManagerPage'

const stationFields = [
  { name: 'station_code', label: '站点编号', required: true },
  { name: 'station_name', label: '站点名称', required: true },
  { name: 'address', label: '地址', type: 'textarea', rows: 2 },
  { name: 'longitude', label: '经度', type: 'number', step: 'any', required: true },
  { name: 'latitude', label: '纬度', type: 'number', step: 'any', required: true },
  { name: 'max_capacity', label: '容量', type: 'number', required: true },
  { name: 'available_slots', label: '空位', type: 'number', required: true },
  {
    name: 'station_status',
    label: '状态',
    type: 'select',
    required: true,
    options: [
      { value: 'normal', label: '正常' },
      { value: 'busy', label: '繁忙' },
      { value: 'closed', label: '关闭' }
    ]
  }
]

const stationColumns = [
  { key: 'station_name', label: '站点名称' },
  { key: 'station_code', label: '站点编号' },
  { key: 'address', label: '地址' },
  { key: 'max_capacity', label: '容量' },
  { key: 'available_slots', label: '空位' },
  { key: 'station_status', label: '状态' }
]

export default function StationsPage() {
  return (
    <AuthGuard>
      <AppShell title="站点">
        <CrudManagerPage
          title="站点列表"
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
            if (key === 'address') {
              const tip = `经度: ${Number(row.longitude).toFixed(6)}  纬度: ${Number(row.latitude).toFixed(6)}`
              return (
                <span className="geo-tip" data-tip={tip}>
                  {String(value)}
                </span>
              )
            }
            if (key === 'station_status') {
              return { normal: '正常', busy: '繁忙', closed: '关闭' }[value] || String(value)
            }
            return String(value)
          }}
        />
      </AppShell>
    </AuthGuard>
  )
}
