import { useNavigate } from 'react-router-dom'
import http from '../api/http'
import { AppShell, AuthGuard } from '../components/Layout'
import CrudManagerPage from '../components/CrudManagerPage'

const orderFields = [
  { name: 'order_no', label: '订单编号', required: true },
  { name: 'user_id', label: '用户 ID', type: 'number', required: true },
  { name: 'equipment_id', label: '设备 ID', type: 'number', required: true },
  { name: 'start_station_id', label: '起点站 ID', type: 'number', required: true },
  { name: 'end_station_id', label: '终点站 ID', type: 'number' },
  { name: 'coupon_id', label: '优惠券 ID', type: 'number' },
  { name: 'start_time', label: '开始时间', type: 'datetime-local', required: true },
  { name: 'end_time', label: '结束时间', type: 'datetime-local' },
  { name: 'expected_amount', label: '预估金额', type: 'number', step: 'any', required: true },
  { name: 'actual_amount', label: '实付金额', type: 'number', step: 'any', required: true },
  {
    name: 'order_status',
    label: '状态',
    type: 'select',
    required: true,
    options: [
      { value: 'pending', label: '待开始' },
      { value: 'active', label: '进行中' },
      { value: 'completed', label: '已完成' },
      { value: 'cancelled', label: '已取消' }
    ]
  },
  { name: 'remark', label: '备注', type: 'textarea', rows: 3 }
]

const orderColumns = [
  { key: 'order_no', label: '订单编号' },
  { key: 'user_id', label: '用户 ID' },
  { key: 'equipment_id', label: '设备 ID' },
  { key: 'start_station_id', label: '起点站' },
  { key: 'actual_amount', label: '实付金额' },
  { key: 'order_status', label: '状态' }
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

function formatStatus(value) {
  return {
    pending: '待开始',
    active: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }[value] || String(value)
}

export default function OrdersPage() {
  const navigate = useNavigate()

  function goToTransactions(record) {
    navigate(`/transactions?userId=${record.user_id}`)
  }

  async function forceReturn(record, reload) {
    const endStationId = window.prompt('请输入归还站点 ID', record.end_station_id || '')
    if (!endStationId) return
    await http.put(`/orders/${record.id}/return`, { end_station_id: Number(endStationId) })
    await reload()
  }

  async function cancelOrder(record, reload) {
    if (!window.confirm(`确认取消订单 ${record.order_no} 吗？`)) return
    await http.put(`/orders/${record.id}/cancel`)
    await reload()
  }

  return (
    <AuthGuard>
      <AppShell title="订单">
        <CrudManagerPage
          title="订单列表"
          apiPath="/orders"
          columns={orderColumns}
          fields={orderFields}
          defaultValues={{ order_status: 'pending', expected_amount: 0, actual_amount: 0 }}
          mapRecordToForm={(record) => ({
            order_no: record.order_no ?? '',
            user_id: record.user_id ?? '',
            equipment_id: record.equipment_id ?? '',
            start_station_id: record.start_station_id ?? '',
            end_station_id: record.end_station_id ?? '',
            coupon_id: record.coupon_id ?? '',
            start_time: record.start_time ?? '',
            end_time: record.end_time ?? '',
            expected_amount: record.expected_amount ?? 0,
            actual_amount: record.actual_amount ?? 0,
            order_status: record.order_status ?? 'pending',
            remark: record.remark ?? ''
          })}
          buildCreatePayload={(formValues) => ({
            ...formValues,
            user_id: Number(formValues.user_id),
            equipment_id: Number(formValues.equipment_id),
            start_station_id: Number(formValues.start_station_id),
            end_station_id: toNumber(formValues.end_station_id),
            coupon_id: toNumber(formValues.coupon_id),
            start_time: toDateTimeValue(formValues.start_time),
            end_time: toDateTimeValue(formValues.end_time),
            expected_amount: Number(formValues.expected_amount || 0),
            actual_amount: Number(formValues.actual_amount || 0)
          })}
          buildUpdatePayload={(formValues) => ({
            order_no: formValues.order_no,
            user_id: Number(formValues.user_id),
            equipment_id: Number(formValues.equipment_id),
            start_station_id: Number(formValues.start_station_id),
            end_station_id: toNumber(formValues.end_station_id),
            coupon_id: toNumber(formValues.coupon_id),
            start_time: toDateTimeValue(formValues.start_time),
            end_time: toDateTimeValue(formValues.end_time),
            expected_amount: Number(formValues.expected_amount || 0),
            actual_amount: Number(formValues.actual_amount || 0),
            order_status: formValues.order_status,
            remark: formValues.remark
          })}
          formatValue={(value, row, key) => {
            if (value === null || value === undefined || value === '') return '--'
            if (key === 'expected_amount' || key === 'actual_amount') return `¥${Number(value).toFixed(2)}`
            if (key === 'order_status') return formatStatus(value)
            return String(value)
          }}
          rowActions={(record, { reload }) => (
            <>
              <button className="inline-btn primary" type="button" onClick={() => forceReturn(record, reload)}>
                还车计费
              </button>
              <button className="inline-btn warn" type="button" onClick={() => cancelOrder(record, reload)}>
                取消
              </button>
              <button className="inline-btn ghost" type="button" onClick={() => goToTransactions(record)}>
                流水
              </button>
            </>
          )}
        />
      </AppShell>
    </AuthGuard>
  )
}
