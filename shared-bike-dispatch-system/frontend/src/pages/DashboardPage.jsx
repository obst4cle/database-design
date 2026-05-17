import { useEffect, useState } from 'react'
import http from '../api/http'
import { AppShell, AuthGuard } from '../components/Layout'

function StatCard({ label, value }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

export default function DashboardPage() {
  const [summary, setSummary] = useState({})

  useEffect(() => {
    http.get('/dashboard/summary').then((response) => setSummary(response.data || {})).catch(() => {})
  }, [])

  return (
    <AuthGuard>
      <AppShell title="运营看板">
        <div className="stat-grid">
          <StatCard label="用户数" value={summary.userTotal ?? '--'} />
          <StatCard label="站点数" value={summary.stationTotal ?? '--'} />
          <StatCard label="设备数" value={summary.equipmentTotal ?? '--'} />
          <StatCard label="订单数" value={summary.orderTotal ?? '--'} />
        </div>

        <div className="panel-grid two-col">
          <section className="card-panel">
            <h4>核心环节</h4>
            <ul className="timeline-list">
              <li>注册登录</li>
              <li>查看站点和设备</li>
              <li>创建订单并完成还车</li>
              <li>生成维修与调度任务</li>
            </ul>
          </section>
          <section className="card-panel">
            <h4>当前状态</h4>
            <div className="status-stack">
              <div><span>已核销优惠券</span><strong>{summary.couponUsedTotal ?? '--'}</strong></div>
              <div><span>调度任务</span><strong>{summary.taskTotal ?? '--'}</strong></div>
              <div><span>待处理故障</span><strong>{summary.faultPendingTotal ?? '--'}</strong></div>
            </div>
          </section>
        </div>
      </AppShell>
    </AuthGuard>
  )
}
