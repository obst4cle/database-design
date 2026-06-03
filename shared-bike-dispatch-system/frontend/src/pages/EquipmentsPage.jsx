import ResourcePage from '../components/ResourcePage'
import { AppShell, AuthGuard } from '../components/Layout'

function formatEquipmentStatus(value) {
  return {
    idle: '空闲',
    in_use: '使用中',
    maintenance: '维修中',
    faulty: '故障中'
  }[value] || String(value ?? '--')
}

function formatEquipmentType(value) {
  return {
    bike: '共享单车'
  }[value] || (value ? '其他设备' : '--')
}

export default function EquipmentsPage() {
  return (
    <AuthGuard>
      <AppShell title="设备">
        <ResourcePage
          title="设备列表"
          apiPath="/equipments"
          columns={[
            { key: 'equipment_code', label: '设备编号' },
            { key: 'equipment_type', label: '设备类型' },
            { key: 'equipment_status', label: '状态' }
          ]}
          formatValue={(value, row, key) => {
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
