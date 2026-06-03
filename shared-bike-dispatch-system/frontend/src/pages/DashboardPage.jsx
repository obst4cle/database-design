import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import http from '../api/http'
import { AppShell, AuthGuard } from '../components/Layout'

function StatCard({ label, value, icon, gradient }) {
  return (
    <article className="stat-card" style={{ background: gradient, color: '#fff' }}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-content">
        <span style={{ color: 'rgba(255,255,255,0.9)' }}>{label}</span>
        <strong>{value}</strong>
      </div>
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
          <StatCard label="累计注册用户" value={summary.userTotal ?? '--'} icon="👥" gradient="linear-gradient(135deg, #3b82f6, #2563eb)" />
          <StatCard label="运营站点总数" value={summary.stationTotal ?? '--'} icon="🅿️" gradient="linear-gradient(135deg, #10b981, #059669)" />
          <StatCard label="投放车辆总数" value={summary.equipmentTotal ?? '--'} icon="🚲" gradient="linear-gradient(135deg, #f59e0b, #d97706)" />
          <StatCard label="历史订单总数" value={summary.orderTotal ?? '--'} icon="📝" gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)" />
        </div>

        <div className="panel-grid two-col" style={{ marginTop: '20px' }}>
          <section className="card-panel">
            <h4>核心引导入口</h4>
            <div className="quick-actions">
              <Link to="/stations" className="quick-action-card">
                <span className="qa-icon">📍</span>
                <div>
                  <h5>网点与停放管理</h5>
                  <p>查看并管理整个片区的服务网点信息与车位容量</p>
                </div>
              </Link>
              <Link to="/equipments" className="quick-action-card">
                <span className="qa-icon">🚲</span>
                <div>
                  <h5>车辆状态监控</h5>
                  <p>追踪全量单车所属站点以及实时运营状态</p>
                </div>
              </Link>
              <Link to="/orders" className="quick-action-card">
                <span className="qa-icon">📱</span>
                <div>
                  <h5>行程与计费大厅</h5>
                  <p>演示如何为用户建单、结束行程、处理满减优惠及结账</p>
                </div>
              </Link>
            </div>
          </section>
          <section className="card-panel">
            <h4>次要运营数据</h4>
            <div className="status-stack">
              <div>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge" style={{ background: '#ecfdf5', color: '#059669', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>营销</span>
                  已核销优惠券
                </span>
                <strong>{summary.couponUsedTotal ?? '--'}</strong>
              </div>
              <div>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge" style={{ background: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>调度</span>
                  今日调度单
                </span>
                <strong>{summary.taskTotal ?? '--'}</strong>
              </div>
              <div>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge" style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>售后</span>
                  待处理故障
                </span>
                <strong>{summary.faultPendingTotal ?? '--'}</strong>
              </div>
            </div>
          </section>
        </div>
      </AppShell>
    </AuthGuard>
  )
}
