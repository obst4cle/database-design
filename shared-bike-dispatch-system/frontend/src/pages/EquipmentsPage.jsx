import ResourcePage from '../components/ResourcePage'
import { AppShell, AuthGuard } from '../components/Layout'

export default function EquipmentsPage() {
  return (
    <AuthGuard>
      <AppShell title="设备">
        <ResourcePage
          title="设备列表"
          apiPath="/equipments"
          columns={['equipment_code', 'equipment_type', 'battery_level', 'equipment_status']}
        />
      </AppShell>
    </AuthGuard>
  )
}
