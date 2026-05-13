import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import http from '../api/http'
import { AppShell, AuthGuard } from '../components/Layout'

function StatCard({ label, value }) {
  return (
    <article className="stat-card transaction-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function formatMoney(value) {
  const number = Number(value)
  if (Number.isNaN(number)) return '--'
  return `¥${number.toFixed(2)}`
}

export default function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState({})
  const [userId, setUserId] = useState('')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const userIdParam = searchParams.get('userId')
    if (userIdParam) {
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
      return
    }

    loadTransactions()
  }, [searchParams])

  async function loadTransactions() {
    setLoading(true)
    setError('')
    try {
      const response = await http.get('/transactions', { params: { page: 1, pageSize: 40 } })
      const rows = response.data.list || []
      setTransactions(rows)
      setSummary({
        totalCount: response.data.total || rows.length,
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
    loadTransactions()
  }, [])

  const filteredRows = useMemo(() => {
    const trimmedKeyword = keyword.trim().toLowerCase()
    return transactions.filter((item) => {
      const matchesUser = !userId.trim() || String(item.user_id) === userId.trim()
      const matchesKeyword = !trimmedKeyword || [item.tx_no, item.tx_type, item.channel, item.tx_status]
        .some((field) => String(field || '').toLowerCase().includes(trimmedKeyword))
      return matchesUser && matchesKeyword
    })
  }, [transactions, userId, keyword])

  async function searchByUser(event) {
    event.preventDefault()
    const trimmed = userId.trim()
    setSearchParams(trimmed ? { userId: trimmed } : {})
  }

  return (
    <AuthGuard>
      <AppShell title="交易流水" subtitle="查看订单扣费、余额变化与流水结果。">
        <div className="panel-grid transaction-layout">
          <div className="stat-grid transaction-stats">
            <StatCard label="流水总数" value={summary.totalCount ?? '--'} />
            <StatCard label="成功流水" value={summary.successCount ?? '--'} />
            <StatCard label="累计金额" value={formatMoney(summary.totalAmount ?? 0)} />
            <StatCard label="当前筛选" value={filteredRows.length} />
          </div>

          <section className="card-panel transaction-toolbar">
            <form className="transaction-search" onSubmit={searchByUser}>
              <label>
                用户 ID
                <input
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  placeholder="输入用户 ID 后回车筛选"
                />
              </label>
              <label>
                关键字
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="流水号 / 类型 / 渠道 / 状态"
                />
              </label>
              <div className="transaction-actions">
                <button className="primary-btn" type="submit">按用户筛选</button>
                <button className="ghost-btn" type="button" onClick={loadTransactions}>刷新全部</button>
              </div>
            </form>
          </section>

          <section className="page-card">
            <div className="page-head">
              <div>
                <h3>流水明细</h3>
                <p>订单计费会在归还时自动写入这里，便于追踪余额变化。</p>
              </div>
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
                  <span>余额前</span>
                  <span>余额后</span>
                  <span>状态</span>
                </div>
                {filteredRows.length === 0 ? (
                  <div className="table-row table-empty"><span>暂无数据</span></div>
                ) : (
                  filteredRows.map((row) => (
                    <div key={row.id} className="table-row transaction-grid">
                      <span>{row.tx_no}</span>
                      <span>{row.user_id}</span>
                      <span>{row.order_id ?? '--'}</span>
                      <span>{row.tx_type}</span>
                      <span>{formatMoney(row.amount)}</span>
                      <span>{formatMoney(row.balance_before)}</span>
                      <span>{formatMoney(row.balance_after)}</span>
                      <span>{row.tx_status}</span>
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </section>
        </div>
      </AppShell>
    </AuthGuard>
  )
}
