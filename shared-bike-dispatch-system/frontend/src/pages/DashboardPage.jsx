import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import http from '../api/http'
import { AppShell, AuthGuard } from '../components/Layout'

function StatCard({ label, value, gradient }) {
  return (
    <article className="stat-card" style={{ background: gradient, color: '#fff' }}>
      <div className="stat-card-content">
        <span style={{ color: 'rgba(255,255,255,0.9)' }}>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  )
}

const EQUIPMENT_STATUS_META = {
  idle: { label: '空闲', color: '#10b981' },
  in_use: { label: '使用中', color: '#3b82f6' },
  maintenance: { label: '维修中', color: '#f59e0b' },
  faulty: { label: '故障中', color: '#ef4444' }
}

function formatDay(value) {
  // 后端返回的 day 可能是 ISO 字符串，只取月-日
  const str = String(value)
  const match = str.match(/(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[2]}-${match[3]}` : str
}

export default function DashboardPage() {
  const [summary, setSummary] = useState({})
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    http.get('/dashboard/summary').then((response) => setSummary(response.data || {})).catch(() => {})
    http.get('/dashboard/analytics').then((response) => setAnalytics(response.data || null)).catch(() => {})
  }, [])

  const equipmentTotal = analytics?.equipmentTotal || 0
  const maxRevenue = Math.max(1, ...(analytics?.revenueTrend || []).map((d) => d.revenue))
  const topStations = (analytics?.stationLoad || []).slice(0, 5)

  return (
    <AuthGuard>
      <AppShell title="运营看板">
        <div className="stat-grid">
          <StatCard label="累计注册用户" value={summary.userTotal ?? '--'} gradient="linear-gradient(135deg, #3b82f6, #2563eb)" />
          <StatCard label="运营站点总数" value={summary.stationTotal ?? '--'} gradient="linear-gradient(135deg, #10b981, #059669)" />
          <StatCard label="投放车辆总数" value={summary.equipmentTotal ?? '--'} gradient="linear-gradient(135deg, #f59e0b, #d97706)" />
          <StatCard label="历史订单总数" value={summary.orderTotal ?? '--'} gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)" />
        </div>

        {/* 使用情况统计 */}
        {analytics && (
          <>
            <div className="analytics-kpi" style={{ marginTop: '20px' }}>
              <div className="kpi-card">
                <span className="kpi-label">车辆利用率</span>
                <strong className="kpi-value">{analytics.utilizationRate}%</strong>
                <span className="kpi-hint">使用中 / 总投放</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">待处理故障</span>
                <strong className="kpi-value">{analytics.maintenance.pending_total}</strong>
                <span className="kpi-hint">已修复 {analytics.maintenance.done_total} 单</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">平均修复时长</span>
                <strong className="kpi-value">{analytics.maintenance.avg_repair_minutes}<small> 分钟</small></strong>
                <span className="kpi-hint">报修到处理</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">调度完成率</span>
                <strong className="kpi-value">{analytics.dispatch.taskCompletionRate}%</strong>
                <span className="kpi-hint">共 {analytics.dispatch.taskTotal} 个工单</span>
              </div>
            </div>

            <div className="panel-grid two-col" style={{ marginTop: '20px' }}>
              {/* 车辆状态分布 */}
              <section className="card-panel">
                <h4>车辆运营状态分布</h4>
                <div className="status-bar">
                  {analytics.equipmentStatus.map((item) => {
                    const meta = EQUIPMENT_STATUS_META[item.status] || { label: item.status, color: '#94a3b8' }
                    const pct = equipmentTotal > 0 ? (item.total / equipmentTotal) * 100 : 0
                    return (
                      <div
                        key={item.status}
                        className="status-bar-seg"
                        style={{ width: `${pct}%`, background: meta.color }}
                        title={`${meta.label}: ${item.total}`}
                      />
                    )
                  })}
                </div>
                <div className="status-legend">
                  {analytics.equipmentStatus.map((item) => {
                    const meta = EQUIPMENT_STATUS_META[item.status] || { label: item.status, color: '#94a3b8' }
                    return (
                      <div key={item.status} className="legend-item">
                        <span className="legend-dot" style={{ background: meta.color }} />
                        <span>{meta.label}</span>
                        <strong>{item.total}</strong>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* 站点忙闲榜 */}
              <section className="card-panel">
                <h4>站点忙闲 / 失衡榜 TOP 5</h4>
                <div className="load-list">
                  {topStations.length === 0 ? (
                    <div className="empty-state">暂无站点数据</div>
                  ) : topStations.map((station) => (
                    <div key={station.id} className="load-row">
                      <span className="load-name" title={station.station_name}>{station.station_name}</span>
                      <div className="load-track">
                        <div
                          className="load-fill"
                          style={{
                            width: `${Math.min(100, station.load_rate)}%`,
                            background: station.load_rate >= 80 ? '#ef4444' : station.load_rate >= 40 ? '#f59e0b' : '#10b981'
                          }}
                        />
                      </div>
                      <span className="load-num">{station.bike_count}/{station.max_capacity}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* 近7天订单与营收趋势 */}
            <section className="card-panel" style={{ marginTop: '20px' }}>
              <h4>近 7 天订单与营收趋势</h4>
              {analytics.revenueTrend.length === 0 ? (
                <div className="empty-state">近 7 天暂无订单</div>
              ) : (
                <div className="trend-chart">
                  {analytics.revenueTrend.map((d) => (
                    <div key={d.day} className="trend-col">
                      <div className="trend-bar-wrap">
                        <span className="trend-value">¥{d.revenue}</span>
                        <div
                          className="trend-bar"
                          style={{ height: `${Math.max(4, (d.revenue / maxRevenue) * 100)}%` }}
                        />
                      </div>
                      <span className="trend-label">{formatDay(d.day)}</span>
                      <span className="trend-orders">{d.order_count} 单</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <div className="panel-grid two-col" style={{ marginTop: '20px' }}>
          <section className="card-panel">
            <h4>核心引导入口</h4>
            <div className="quick-actions">
              <Link to="/stations" className="quick-action-card">
                <div>
                  <h5>网点与停放管理</h5>
                  <p>查看并管理整个片区的服务网点信息与车位容量</p>
                </div>
              </Link>
              <Link to="/equipments" className="quick-action-card">
                <div>
                  <h5>车辆状态监控</h5>
                  <p>追踪全量单车所属站点以及实时运营状态</p>
                </div>
              </Link>
              <Link to="/orders" className="quick-action-card">
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
