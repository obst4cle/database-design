import ResourcePage from '../components/ResourcePage'
import { AppShell, AuthGuard } from '../components/Layout'

export default function EquipmentsPage() {
  return (
    <AuthGuard>
      <AppShell title="设备管理" subtitle="查看单车或充电宝状态和电量。">
        <ResourcePage
          title="设备列表"
          description="用于展示设备状态和电量。"
          apiPath="/equipments"
          columns={["equipment_code", "equipment_type", "battery_level", "equipment_status"]}
        />
      </AppShell>
    </AuthGuard>
  )
}
