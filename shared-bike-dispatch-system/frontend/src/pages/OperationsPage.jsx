import ResourcePage from '../components/ResourcePage'
import http from '../api/http'
import { useState } from 'react'
import { AppShell, AuthGuard } from '../components/Layout'

export default function OperationsPage() {
  const [autoMessage, setAutoMessage] = useState('')

  async function handleAutoDispatch() {
    const desiredMoveCount = Number(window.prompt('每次搬运几辆车？', '3') || 3)
    const balanceRatio = Number(window.prompt('平衡比例（0.2 - 0.8，推荐 0.5）', '0.5') || 0.5)
    try {
      const response = await http.post('/dispatch-tasks/auto', { desiredMoveCount, balanceRatio })
      setAutoMessage(response.message || '已生成调度任务')
      window.alert(response.message || '已生成调度任务')
    } catch (error) {
      setAutoMessage(error.message)
      window.alert(error.message)
    }
  }

  return (
    <AuthGuard>
      <AppShell title="运维调度" subtitle="展示维修记录和调度任务。">
        <section className="card-panel" style={{ marginBottom: 16 }}>
          <div className="page-head">
            <div>
              <h4>智能调度</h4>
              <p>按站点位置和供需缺口自动生成搬运任务。</p>
            </div>
            <button className="primary-btn" type="button" onClick={handleAutoDispatch}>智能生成调度任务</button>
          </div>
          {autoMessage ? <p className="form-message" style={{ marginTop: 12 }}>{autoMessage}</p> : null}
        </section>
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
