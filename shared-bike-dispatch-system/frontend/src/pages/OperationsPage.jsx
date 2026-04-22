import ResourcePage from '../components/ResourcePage'
import { AppShell, AuthGuard } from '../components/Layout'

export default function OperationsPage() {
  return (
    <AuthGuard>
      <AppShell title="运维调度" subtitle="展示维修记录和调度任务。">
        <div className="panel-grid two-col">
          <ResourcePage
            title="维修记录"
            description="用于记录设备故障和维修状态。"
            apiPath="/maintenance-logs"
            columns={["equipment_id", "fault_type", "repair_status", "reported_at"]}
          />
          <ResourcePage
            title="调度任务"
            description="用于记录站点搬运工单。"
            apiPath="/dispatch-tasks"
            columns={["task_no", "staff_id", "task_status", "planned_at"]}
          />
        </div>
      </AppShell>
    </AuthGuard>
  )
}
