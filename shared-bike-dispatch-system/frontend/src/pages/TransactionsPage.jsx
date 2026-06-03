import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import http from '../api/http'
import { AppShell, AuthGuard } from '../components/Layout'

function StatCard({ label, value }) {
  return (
    <article className="stat-card transaction-stat">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
    </article>
  )
}

function formatMoney(value) {
  const number = Number(value)
  if (Number.isNaN(number)) return '--'
  return `¥${number.toFixed(2)}`
}

function txStatusBadge(status) {
  const map = {
    success: { label: '成功', cls: 'badge success' },
    pending: { label: '等待', cls: 'badge muted' },
    failed: { label: '失败', cls: 'badge danger' }
  }
  return map[status] || { label: String(status), cls: 'badge muted' }
}

function txTypeLabel(type) {
  return {
    charge: '充值',
    refund: '退款',
    fare: '扣费'
  }[type] || String(type)
}

export default function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState({})
  const [userId, setUserId] = useState('')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedTx, setSelectedTx] = useState(null)
  const [expandedDates, setExpandedDates] = useState({})

  async function loadTransactions() {
    setLoading(true)
    setError('')
    try {
      const response = await http.get('/transactions', { params: { page: 1, pageSize: 40 } })
      const rows = response.data?.list || []
      setTransactions(rows)
      setSummary({
        totalCount: response.data?.total || rows.length,
        successCount: rows.filter((item) => item.tx_status === 'success').length,
        totalAmount: rows.reduce((sum, item) => sum + Number(item.amount || 0), 0)
      })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const userIdParam = searchParams.get('userId')
    if (!userIdParam) {
      setUserId('')
      loadTransactions()
      return
    }

    setUserId(userIdParam)
    setLoading(true)
    setError('')
    http.get(`/transactions/user/${userIdParam}`)
      .then((response) => {
        const rows = response.data || []
        setTransactions(rows)
        setSummary({
          totalCount: rows.length,
          successCount: rows.filter((item) => item.tx_status === 'success').length,
          totalAmount: rows.reduce((sum, item) => sum + Number(item.amount || 0), 0)
        })
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [searchParams])

  const filteredRows = useMemo(() => {
    const trimmedKeyword = keyword.trim().toLowerCase()
    return transactions.filter((item) => {
      const matchesUser = !userId.trim() || String(item.user_id) === userId.trim()
      const matchesKeyword = !trimmedKeyword || [item.tx_no, item.tx_type, item.channel, item.tx_status]
        .some((field) => String(field || '').toLowerCase().includes(trimmedKeyword))
      return matchesUser && matchesKeyword
    })
  }, [transactions, userId, keyword])

  const groupedByDate = useMemo(() => {
    const map = {}
    filteredRows.forEach((row) => {
      const raw = row.created_at || row.tx_time || row.created || row.createdAt || ''
      const dateKey = raw ? String(raw).split('T')[0] : '未知日期'
      if (!map[dateKey]) map[dateKey] = []
      map[dateKey].push(row)
    })
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filteredRows])

  function toggleDate(key) {
    setExpandedDates((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function openDetail(row) {
    setSelectedTx(row)
    setDetailModalOpen(true)
  }

  function closeDetail() {
    setSelectedTx(null)
    setDetailModalOpen(false)
  }

  function searchByUser(event) {
    event.preventDefault()
    const trimmed = userId.trim()
    setSearchParams(trimmed ? { userId: trimmed } : {})
  }

  return (
    <AuthGuard>
      <AppShell title="流水">
        <div className="panel-grid transaction-layout">
          <div className="stat-grid transaction-stats">
            <StatCard label="总数" value={summary.totalCount ?? '--'} />
            <StatCard label="成功" value={summary.successCount ?? '--'} />
            <StatCard label="金额" value={formatMoney(summary.totalAmount ?? 0)} />
            <StatCard label="筛选后" value={filteredRows.length} />
          </div>

          <section className="card-panel transaction-toolbar">
            <form className="transaction-search" onSubmit={searchByUser}>
              <label>
                用户 ID
                <input
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  placeholder="输入用户 ID"
                />
              </label>
              <label>
                关键词
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="流水号、类型、渠道、状态"
                />
              </label>
              <div className="transaction-actions">
                <button className="primary-btn" type="submit">筛选</button>
                <button className="ghost-btn" type="button" onClick={loadTransactions}>刷新</button>
              </div>
            </form>
          </section>

          <section className="page-card">
            <div className="page-head">
              <h3>流水明细</h3>
            </div>

            {loading ? <div className="empty-state">加载中...</div> : null}
            {error ? <div className="empty-state error">{error}</div> : null}

            {!loading && !error ? (
              <div className="table-shell transaction-table">
                <div className="table-header transaction-grid">
                      <span>流水号</span>
                      <span>用户</span>
                      <span>订单</span>
                      <span>类型</span>
                      <span>金额</span>
                      <span>变更前</span>
                      <span>变更后</span>
                      <span>状态</span>
                    </div>
                {groupedByDate.length === 0 ? (
                  <div className="table-row table-empty"><span>暂无数据</span></div>
                ) : (
                  groupedByDate.map(([dateKey, rows]) => {
                    const expanded = Boolean(expandedDates[dateKey])
                    return (
                      <div key={dateKey} className="transaction-group">
                        <div className="transaction-group-head">
                          <div>
                            <button className="ghost-btn" type="button" onClick={() => toggleDate(dateKey)}>
                              {expanded ? '收起' : '展开'}
                            </button>
                            <strong style={{ marginLeft: 12 }}>{dateKey}</strong>
                            <span style={{ marginLeft: 8, color: 'var(--muted)' }}>共 {rows.length} 条</span>
                          </div>
                        </div>

                        {expanded ? (
                          rows.map((row) => {
                            const status = txStatusBadge(row.tx_status)
                            const amountClass = Number(row.amount || 0) >= 0 ? 'amt-positive' : 'amt-negative'
                            return (
                              <div key={row.id} className="table-row transaction-grid" onClick={() => openDetail(row)} style={{ cursor: 'pointer' }}>
                                <span className="tx-no">{row.tx_no}</span>
                                <span className="tx-user">{row.user_id}</span>
                                <span className="tx-order">{row.order_id ?? '--'}</span>
                                <span className="tx-type">{txTypeLabel(row.tx_type)}</span>
                                <span className={`tx-amount ${amountClass}`}>{formatMoney(row.amount)}</span>
                                <span className="tx-balance-before">{formatMoney(row.balance_before)}</span>
                                <span className="tx-balance-after">{formatMoney(row.balance_after)}</span>
                                <span className="tx-status"><span className={status.cls}>{status.label}</span></span>
                              </div>
                            )
                          })
                        ) : null}
                      </div>
                    )
                  })
                )}
              </div>
            ) : null}
          </section>
        </div>

        {detailModalOpen && selectedTx ? (
          <div className="modal-backdrop" role="presentation" onClick={closeDetail}>
            <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h4>流水详情</h4>
                <button className="ghost-btn" type="button" onClick={closeDetail}>关闭</button>
              </div>

              <div className="crud-form">
                <div className="status-text">流水号：{selectedTx.tx_no}</div>
                <div className="transaction-detail-grid">
                  <div><strong>用户</strong><div>{selectedTx.user_id}</div></div>
                  <div><strong>订单</strong><div>{selectedTx.order_id ?? '--'}</div></div>
                  <div><strong>类型</strong><div>{txTypeLabel(selectedTx.tx_type)}</div></div>
                  <div><strong>渠道</strong><div>{selectedTx.channel ?? '--'}</div></div>
                  <div><strong>金额</strong><div className={`tx-amount ${Number(selectedTx.amount || 0) >= 0 ? 'amt-positive' : 'amt-negative'}`}>{formatMoney(selectedTx.amount)}</div></div>
                  <div><strong>变更前</strong><div>{formatMoney(selectedTx.balance_before)}</div></div>
                  <div><strong>变更后</strong><div>{formatMoney(selectedTx.balance_after)}</div></div>
                  <div><strong>状态</strong><div><span className={txStatusBadge(selectedTx.tx_status).cls}>{txStatusBadge(selectedTx.tx_status).label}</span></div></div>
                  <div style={{ gridColumn: '1 / -1' }}><strong>时间</strong><div>{selectedTx.created_at || selectedTx.tx_time || '--'}</div></div>
                </div>
                <div className="modal-actions">
                  <button className="ghost-btn" type="button" onClick={closeDetail}>关闭</button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </AppShell>
    </AuthGuard>
  )
}
