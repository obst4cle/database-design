import ResourcePage from '../components/ResourcePage'
import { AppShell, AuthGuard } from '../components/Layout'

export default function StationsPage() {
  return (
    <AuthGuard>
      <AppShell title="网点管理" subtitle="查看站点容量、经纬度和空闲位。">
        <ResourcePage
          title="网点列表"
          description="用于展示附近站点和容量状态。"
          apiPath="/stations"
          columns={["station_name", "station_code", "available_slots", "station_status"]}
        />
      </AppShell>
    </AuthGuard>
  )
}
