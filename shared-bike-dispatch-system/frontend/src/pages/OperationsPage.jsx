import ResourcePage from '../components/ResourcePage'
import http from '../api/http'
import { useState } from 'react'
import { AppShell, AuthGuard } from '../components/Layout'

export default function OperationsPage() {
  const [autoMessage, setAutoMessage] = useState('')

  async function handleAutoDispatch() {
    const desiredMoveCount = Number(window.prompt('每次搬运几辆车？', '3') || 3)
    const balanceRatio = Number(window.prompt('平衡比例（0.2 - 0.8）', '0.5') || 0.5)
    try {
      const response = await http.post('/dispatch-tasks/auto', { desiredMoveCount, balanceRatio })
      setAutoMessage(response.message || '已生成调度任务')
    } catch (error) {
      setAutoMessage(error.message)
    }
  }

  return (
    <AuthGuard>
      <AppShell title="调度">
        <section className="card-panel action-panel">
          <div className="page-head">
            <h4>智能调度</h4>
            <button className="primary-btn" type="button" onClick={handleAutoDispatch}>生成任务</button>
          </div>
          {autoMessage ? <p className="status-text">{autoMessage}</p> : null}
        </section>
        <div className="panel-grid two-col">
          <ResourcePage
            title="维修记录"
            apiPath="/maintenance-logs"
            columns={['equipment_id', 'fault_type', 'repair_status', 'reported_at']}
          />
          <ResourcePage
            title="调度任务"
            apiPath="/dispatch-tasks"
            columns={['task_no', 'staff_id', 'task_status', 'planned_at']}
          />
        </div>
      </AppShell>
    </AuthGuard>
  )
}
