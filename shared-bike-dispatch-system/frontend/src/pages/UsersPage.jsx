import { useEffect, useMemo, useState } from 'react'
import http from '../api/http'
import { AppShell, AuthGuard } from '../components/Layout'
import CrudManagerPage from '../components/CrudManagerPage'

const verifyOptions = [
  { value: 0, label: '未实名' },
  { value: 1, label: '已实名' }
]

const accountStatusOptions = [
  { value: 'active', label: '正常' },
  { value: 'frozen', label: '冻结' },
  { value: 'closed', label: '注销' }
]

function extractList(response) {
  return response?.data?.list || response?.data?.data?.list || []
}

const userColumns = [
  { key: 'username', label: '用户名' },
  { key: 'real_name', label: '实名' },
  { key: 'phone', label: '电话' },
  { key: 'rank_id', label: '会员等级' },
  { key: 'balance', label: '余额' },
  { key: 'credit_score', label: '信用分' },
  { key: 'is_verified', label: '实名认证' },
  { key: 'account_status', label: '账号状态' }
]

export default function UsersPage() {
  const [ranks, setRanks] = useState([])

  useEffect(() => {
    let ignore = false
    async function loadRanks() {
      try {
        const response = await http.get('/user-ranks', { params: { page: 1, pageSize: 100 } })
        if (!ignore) setRanks(extractList(response))
      } catch (error) {
        if (!ignore) setRanks([])
      }
    }
    loadRanks()
    return () => {
      ignore = true
    }
  }, [])

  const rankOptions = useMemo(
    () => ranks.map((rank) => ({ value: String(rank.id), label: rank.rank_name || rank.rank_code || `等级 #${rank.id}` })),
    [ranks]
  )
  const rankNameById = useMemo(
    () => ranks.reduce((map, rank) => {
      map[String(rank.id)] = rank.rank_name || rank.rank_code || `等级 #${rank.id}`
      return map
    }, {}),
    [ranks]
  )

  const userFields = useMemo(() => [
    { name: 'username', label: '用户名（仅新增时可设置）', required: true },
    { name: 'password', label: '初始密码（仅新增时生效）', type: 'password' },
    { name: 'real_name', label: '真实姓名' },
    { name: 'phone', label: '电话', required: true },
    { name: 'rank_id', label: '会员等级', type: 'select', required: true, options: rankOptions },
    { name: 'balance', label: '余额', type: 'number', step: 'any' },
    { name: 'credit_score', label: '信用分', type: 'number' },
    { name: 'is_verified', label: '实名认证', type: 'select', options: verifyOptions },
    { name: 'account_status', label: '账号状态', type: 'select', options: accountStatusOptions }
  ], [rankOptions])

  return (
    <AuthGuard>
      <AppShell title="用户">
        <CrudManagerPage
          title="会员列表"
          apiPath="/users"
          columns={userColumns}
          fields={userFields}
          createLabel="新增会员"
          helperText="用户名与密码仅在新增时设置；编辑时这两项不会被修改。"
          defaultValues={{ is_verified: 0, account_status: 'active', balance: 0, credit_score: 100 }}
          mapRecordToForm={(record) => ({
            username: record.username ?? '',
            password: '',
            real_name: record.real_name ?? '',
            phone: record.phone ?? '',
            rank_id: record.rank_id != null ? String(record.rank_id) : '',
            balance: record.balance ?? 0,
            credit_score: record.credit_score ?? 100,
            is_verified: Number(record.is_verified ?? 0),
            account_status: record.account_status ?? 'active'
          })}
          buildCreatePayload={(formValues) => ({
            username: formValues.username,
            password: formValues.password,
            real_name: formValues.real_name || null,
            phone: formValues.phone,
            rank_id: Number(formValues.rank_id),
            balance: Number(formValues.balance || 0),
            credit_score: Number(formValues.credit_score || 100),
            is_verified: Number(formValues.is_verified || 0),
            account_status: formValues.account_status
          })}
          buildUpdatePayload={(formValues) => ({
            // 后端 updateFields 不含 username/password，这里也不提交
            real_name: formValues.real_name || null,
            phone: formValues.phone,
            rank_id: Number(formValues.rank_id),
            balance: Number(formValues.balance || 0),
            credit_score: Number(formValues.credit_score || 100),
            is_verified: Number(formValues.is_verified || 0),
            account_status: formValues.account_status
          })}
          formatValue={(value, row, key) => {
            if (key === 'rank_id') return rankNameById[String(value)] || `等级 #${value}`
            if (key === 'balance') return `¥${Number(value || 0).toFixed(2)}`
            if (key === 'is_verified') return Number(value) ? '已实名' : '未实名'
            if (key === 'account_status') {
              return accountStatusOptions.find((item) => item.value === value)?.label || String(value)
            }
            if (value === null || value === undefined || value === '') return '--'
            return String(value)
          }}
        />
      </AppShell>
    </AuthGuard>
  )
}
