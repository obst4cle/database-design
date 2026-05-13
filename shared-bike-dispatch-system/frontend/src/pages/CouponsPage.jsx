import http from '../api/http'
import { AppShell, AuthGuard } from '../components/Layout'
import CrudManagerPage from '../components/CrudManagerPage'

const couponFields = [
  { name: 'user_id', label: '用户 ID', type: 'number', required: true },
  { name: 'order_id', label: '订单 ID', type: 'number' },
  { name: 'coupon_code', label: '优惠券编号', required: true },
  { name: 'coupon_name', label: '优惠券名称', required: true },
  { name: 'coupon_type', label: '优惠券类型', required: true },
  { name: 'face_value', label: '面值', type: 'number', step: 'any', required: true },
  { name: 'min_spend', label: '使用门槛', type: 'number', step: 'any' },
  { name: 'expire_at', label: '过期时间', type: 'datetime-local', required: true },
  { name: 'used_at', label: '核销时间', type: 'datetime-local' },
  {
    name: 'is_used',
    label: '是否已使用',
    type: 'select',
    options: [
      { value: 0, label: '否' },
      { value: 1, label: '是' }
    ]
  },
  { name: 'source', label: '来源', required: true }
]

const couponColumns = [
  { key: 'coupon_code', label: '优惠券编号' },
  { key: 'coupon_name', label: '优惠券名称' },
  { key: 'coupon_type', label: '类型' },
  { key: 'face_value', label: '面值' },
  { key: 'is_used', label: '状态' },
  { key: 'expire_at', label: '过期时间' }
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
      <AppShell title="优惠营销" subtitle="管理优惠券发放、核销和过期状态。">
        <CrudManagerPage
          title="优惠券列表"
          description="支持新增、编辑、核销和失效处理。"
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
            if (key === 'is_used') return Number(value) ? '已核销' : '未核销'
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
