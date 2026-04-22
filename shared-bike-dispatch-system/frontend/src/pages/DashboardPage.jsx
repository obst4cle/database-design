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
    http.get('/dashboard/summary').then((response) => setSummary(response.data || {}))
  }, [])

  return (
    <AuthGuard>
      <AppShell title="首页看板" subtitle="展示共享单车调度管理系统的整体状态。">
        <div className="stat-grid">
          <StatCard label="用户数" value={summary.userTotal ?? '--'} />
          <StatCard label="网点数" value={summary.stationTotal ?? '--'} />
          <StatCard label="设备数" value={summary.equipmentTotal ?? '--'} />
          <StatCard label="订单数" value={summary.orderTotal ?? '--'} />
        </div>

        <div className="panel-grid two-col">
          <section className="card-panel">
            <h4>核心闭环</h4>
            <ul className="timeline-list">
              <li>用户注册登录。</li>
              <li>查看网点和设备。</li>
              <li>创建订单并完成支付。</li>
              <li>故障触发维修和调度。</li>
            </ul>
          </section>
          <section className="card-panel">
            <h4>系统状态</h4>
            <div className="status-stack">
              <div><span>优惠券使用</span><strong>{summary.couponUsedTotal ?? '--'}</strong></div>
              <div><span>调度任务</span><strong>{summary.taskTotal ?? '--'}</strong></div>
              <div><span>待维修故障</span><strong>{summary.faultPendingTotal ?? '--'}</strong></div>
            </div>
          </section>
        </div>
      </AppShell>
    </AuthGuard>
  )
}
