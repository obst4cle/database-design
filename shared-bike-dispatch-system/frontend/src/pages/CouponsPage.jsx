import http from '../api/http'
import { useEffect, useMemo, useState } from 'react'
import { AppShell, AuthGuard } from '../components/Layout'
import CrudManagerPage from '../components/CrudManagerPage'

const baseCouponFields = [
  { name: 'order_id', label: '订单 ID', type: 'number' },
  { name: 'coupon_code', label: '券编号', required: true },
  { name: 'coupon_name', label: '券名称', required: true },
  { name: 'coupon_type', label: '类型', required: true },
  { name: 'face_value', label: '面额', type: 'number', step: 'any', required: true },
  { name: 'min_spend', label: '门槛', type: 'number', step: 'any' },
  { name: 'expire_at', label: '到期时间', type: 'datetime-local', required: true },
  { name: 'used_at', label: '核销时间', type: 'datetime-local' },
  {
    name: 'is_used',
    label: '是否使用',
    type: 'select',
    options: [
      { value: 0, label: '未使用' },
      { value: 1, label: '已使用' }
    ]
  },
  { name: 'source', label: '来源', required: true }
]

const couponColumns = [
  { key: 'coupon_code', label: '券编号' },
  { key: 'user_id', label: '用户名' },
  { key: 'coupon_name', label: '券名称' },
  { key: 'coupon_type', label: '类型' },
  { key: 'face_value', label: '面额' },
  { key: 'is_used', label: '状态' },
  { key: 'expire_at', label: '到期时间' }
]

function toNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(value)
  return Number.isNaN(number) ? null : number
}

function toDateTimeValue(value) {
  if (!value) return null
  return String(value).replace('T', ' ').slice(0, 19)
}

export default function CouponsPage() {
  const [users, setUsers] = useState([])
  const userOptions = useMemo(() => users.map((user) => ({
    value: String(user.id),
    label: `${user.username}${user.real_name ? `（${user.real_name}）` : ''}`
  })), [users])
  const userNameById = useMemo(() => {
    return users.reduce((map, user) => {
      map[String(user.id)] = user.username
      return map
    }, {})
  }, [users])
  const couponFields = useMemo(() => [
    {
      name: 'user_id',
      label: '用户名',
      type: 'select',
      required: true,
      options: userOptions
    },
    ...baseCouponFields
  ], [userOptions])

  useEffect(() => {
    let ignore = false
    async function loadUsers() {
      try {
        const response = await http.get('/users', { params: { page: 1, pageSize: 100 } })
        const list = response.data?.list || response.data?.data?.list || []
        if (!ignore) setUsers(list)
      } catch (error) {
        if (!ignore) setUsers([])
      }
    }

    loadUsers()
    return () => {
      ignore = true
    }
  }, [])

  async function markAsUsed(record, reload) {
    if (!window.confirm(`确认核销优惠券 ${record.coupon_code} 吗？`)) return
    await http.put(`/coupons/${record.id}/use`, { order_id: record.order_id || null })
    await reload()
  }

  async function disableCoupon(record, reload) {
    if (!window.confirm(`确认让优惠券 ${record.coupon_code} 失效吗？`)) return
    await http.put(`/coupons/${record.id}/disable`)
    await reload()
  }

  return (
    <AuthGuard>
      <AppShell title="优惠券">
        <CrudManagerPage
          title="优惠券列表"
          apiPath="/coupons"
          columns={couponColumns}
          fields={couponFields}
          defaultValues={{ is_used: 0, source: 'system' }}
          mapRecordToForm={(record) => ({
            user_id: record.user_id ?? '',
            order_id: record.order_id ?? '',
            coupon_code: record.coupon_code ?? '',
            coupon_name: record.coupon_name ?? '',
            coupon_type: record.coupon_type ?? '',
            face_value: record.face_value ?? 0,
            min_spend: record.min_spend ?? 0,
            expire_at: record.expire_at ?? '',
            used_at: record.used_at ?? '',
            is_used: Number(record.is_used ?? 0),
            source: record.source ?? 'system'
          })}
          buildCreatePayload={(formValues) => ({
            ...formValues,
            user_id: Number(formValues.user_id),
            order_id: toNumber(formValues.order_id),
            face_value: toNumber(formValues.face_value) ?? 0,
            min_spend: toNumber(formValues.min_spend) ?? 0,
            expire_at: toDateTimeValue(formValues.expire_at),
            used_at: toDateTimeValue(formValues.used_at),
            is_used: Number(formValues.is_used || 0)
          })}
          buildUpdatePayload={(formValues) => ({
            user_id: Number(formValues.user_id),
            order_id: toNumber(formValues.order_id),
            coupon_code: formValues.coupon_code,
            coupon_name: formValues.coupon_name,
            coupon_type: formValues.coupon_type,
            face_value: toNumber(formValues.face_value) ?? 0,
            min_spend: toNumber(formValues.min_spend) ?? 0,
            expire_at: toDateTimeValue(formValues.expire_at),
            used_at: toDateTimeValue(formValues.used_at),
            is_used: Number(formValues.is_used || 0),
            source: formValues.source
          })}
          formatValue={(value, row, key) => {
            if (key === 'user_id') return userNameById[String(value)] || `用户 #${value}`
            if (key === 'is_used') return Number(value) ? '已核销' : '未核销'
            if (key === 'face_value') return `¥${Number(value || 0).toFixed(2)}`
            if (value === null || value === undefined || value === '') return '--'
            return String(value)
          }}
          rowActions={(record, { reload }) => (
            <>
              <button className="inline-btn primary" type="button" onClick={() => markAsUsed(record, reload)}>
                核销
              </button>
              <button className="inline-btn ghost" type="button" onClick={() => disableCoupon(record, reload)}>
                失效
              </button>
            </>
          )}
        />
      </AppShell>
    </AuthGuard>
  )
}
