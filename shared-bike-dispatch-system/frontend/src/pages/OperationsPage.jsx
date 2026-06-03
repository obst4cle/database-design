import http from '../api/http'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AppShell, AuthGuard } from '../components/Layout'

export default function OperationsPage() {
  const [maintenanceLogs, setMaintenanceLogs] = useState([])
  const [dispatchTasks, setDispatchTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [demoMessage, setDemoMessage] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [mRes, dRes] = await Promise.all([
        http.get('/maintenance-logs', { params: { page: 1, pageSize: 15 } }),
        http.get('/dispatch-tasks', { params: { page: 1, pageSize: 15 } })
      ])
      setMaintenanceLogs(mRes.data?.list || [])
      setDispatchTasks(dRes.data?.list || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function startMaintenance(record) {
    await http.put(`/maintenance-logs/${record.id}/start`)
    await loadData()
  }

  async function finishMaintenance(record) {
    await http.put(`/maintenance-logs/${record.id}/finish`, { repair_result: '现场检修完成，车辆恢复可用' })
    await loadData()
  }

  async function acceptTask(record) {
    await http.put(`/dispatch-tasks/${record.id}/accept`)
    await loadData()
  }

  async function finishTask(record) {
    await http.put(`/dispatch-tasks/${record.id}/finish`)
    await loadData()
  }

  async function createDemoMaintenance() {
    setDemoMessage('')
    try {
      const response = await http.get('/equipments', { params: { page: 1, pageSize: 20 } })
      const target = (response.data?.list || [])[0]
      if (!target) return setDemoMessage('没有可用于演示的设备')

      const logRes = await http.post('/maintenance-logs', {
        equipment_id: target.id, fault_type: 'vehicle_fault',
        fault_description: '演示示例：插入报修记录后自动冻结设备', repair_status: 'reported'
      })
      setDemoMessage(`已创建演示报修 #${logRes.data?.id || '--'}，设备 ${target.equipment_code || target.id} 状态已冻结为故障中`)
      await loadData()
    } catch (error) {
      setDemoMessage(error.message)
    }
  }

  function getStatusLabel(status) {
    return { reported: '已提交', processing: '处理中', done: '已修复', pending: '待指派', doing: '调拨中' }[status] || String(status)
  }

  return (
    <AuthGuard>
      <AppShell title="无界控制台">
        <div className="console-layout">
          <header className="console-header">
            <div className="ch-left">
              <span className="ch-kicker">全域运行指挥中心</span>
              <h2>指令与告警监控队列</h2>
              <p>采用无界流式队列，实时追踪现场异常状态与运力调拨节点。</p>
            </div>
            <div className="ch-actions">
              <button className="console-btn outline" onClick={createDemoMaintenance}>
                <span>+</span> 触发故障模拟
              </button>
              <button className="console-btn ghost" onClick={loadData}>
                刷新队列
              </button>
            </div>
          </header>

          {demoMessage && (
            <div className="console-system-alert">
              <strong>系统回执：</strong> {demoMessage}
            </div>
          )}

          <div className="console-split-view">
            {/* Maintenance Queue */}
            <div className="console-column">
              <div className="col-head">
                <h4>⚠️ 异常干预队列</h4>
                <span className="col-count">{maintenanceLogs.length} 项</span>
              </div>
              <div className="console-list">
                {loading ? <div className="console-empty">同步中...</div> : null}
                {!loading && maintenanceLogs.length === 0 ? <div className="console-empty">队列畅通，无积压告警</div> : null}
                
                {maintenanceLogs.map(log => (
                  <div key={log.id} className="console-item">
                    <div className="c-item-main">
                      <div className="c-item-title">
                        <span className={`c-dot ${log.repair_status}`}></span>
                        <span>设备 #{log.equipment_id} {log.fault_type === 'vehicle_fault' ? '车辆故障' : '未知故障'}</span>
                      </div>
                      <div className="c-item-meta">
                        <span>报修：{log.reported_at?.replace('T', ' ').slice(0, 16)}</span>
                        <span>状态：{getStatusLabel(log.repair_status)}</span>
                      </div>
                    </div>
                    <div className="c-item-actions">
                      {log.repair_status === 'reported' && <button onClick={() => startMaintenance(log)}>进场维修</button>}
                      {log.repair_status === 'processing' && <button onClick={() => finishMaintenance(log)}>完工解冻</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dispatch Tasks */}
            <div className="console-column col-border">
              <div className="col-head">
                <h4>🔄 运力调拨工单</h4>
                <span className="col-count">{dispatchTasks.length} 项</span>
              </div>
              <div className="console-list">
                {loading ? <div className="console-empty">同步中...</div> : null}
                {!loading && dispatchTasks.length === 0 ? <div className="console-empty">暂无运力调拨计划</div> : null}

                {dispatchTasks.map(task => (
                  <div key={task.id} className="console-item">
                    <div className="c-item-main">
                      <div className="c-item-title">
                        <span className={`c-dot ${task.task_status}`}></span>
                        <span>工单 {task.task_no}</span>
                      </div>
                      <div className="c-item-meta">
                        <span>下达至：人员 #{task.staff_id}</span>
                        <span>时效：{task.planned_at?.replace('T', ' ').slice(0, 16)}</span>
                        <span>进度：{getStatusLabel(task.task_status)}</span>
                      </div>
                    </div>
                    <div className="c-item-actions">
                      {task.task_status === 'pending' && <button onClick={() => acceptTask(task)}>外勤接单</button>}
                      {task.task_status === 'doing' && <button onClick={() => finishTask(task)}>妥投归档</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </AppShell>
    </AuthGuard>
  )
}
