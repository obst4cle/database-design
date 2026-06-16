import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
  { key: 'user_id', label: '用户' },
  { key: 'equipment_id', label: '设备' },
  { key: 'start_station_id', label: '起点站' },
  { key: 'end_station_id', label: '终点站' },
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

function extractList(response) {
  return response?.data?.list || response?.data?.data?.list || []
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const [flowMessage, setFlowMessage] = useState('')
  const [stations, setStations] = useState([])
  const [users, setUsers] = useState([])
  const [equipments, setEquipments] = useState([])
  const [stationKeyword, setStationKeyword] = useState('')
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [returnRecord, setReturnRecord] = useState(null)
  const [returnStationId, setReturnStationId] = useState('')
  const [simulatedMinutes, setSimulatedMinutes] = useState('12')
  const [returnError, setReturnError] = useState('')
  const [returnSaving, setReturnSaving] = useState(false)
  const returnReloadRef = useRef(null)

  const userNameById = useMemo(() => users.reduce((map, u) => { map[String(u.id)] = u.username; return map }, {}), [users])
  const equipCodeById = useMemo(() => equipments.reduce((map, e) => { map[String(e.id)] = e.equipment_code; return map }, {}), [equipments])

  useEffect(() => {
    let ignore = false
    async function loadRelated() {
      try {
        const [stationRes, userRes, equipRes] = await Promise.all([
          http.get('/stations', { params: { page: 1, pageSize: 100 } }),
          http.get('/users', { params: { page: 1, pageSize: 100 } }),
          http.get('/equipments', { params: { page: 1, pageSize: 200 } })
        ])
        if (!ignore) {
          setStations(extractList(stationRes))
          setUsers(extractList(userRes))
          setEquipments(extractList(equipRes))
        }
      } catch (error) {
        if (!ignore) {
          setFlowMessage(error.message)
        }
      }
    }

    loadRelated()
    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    if (!returnModalOpen) return undefined
    document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [returnModalOpen])

  const filteredStations = useMemo(() => {
    const keyword = stationKeyword.trim().toLowerCase()
    if (!keyword) return stations

    return stations.filter((station) => {
      const stationName = String(station.station_name || '').toLowerCase()
      const stationCode = String(station.station_code || '').toLowerCase()
      const address = String(station.address || '').toLowerCase()
      return stationName.includes(keyword) || stationCode.includes(keyword) || address.includes(keyword)
    })
  }, [stationKeyword, stations])

  function goToTransactions(record) {
    navigate(`/transactions?userId=${record.user_id}`)
  }

  async function startDemoOrder(reload) {
    setFlowMessage('')
    try {
      const [usersResponse, equipmentsResponse] = await Promise.all([
        http.get('/users', { params: { page: 1, pageSize: 1 } }),
        http.get('/equipments', { params: { page: 1, pageSize: 20 } })
      ])
      const user = extractList(usersResponse)[0]
      const equipment = extractList(equipmentsResponse).find((item) => item.equipment_status === 'idle' && item.station_id)
      if (!user || !equipment) {
        setFlowMessage('缺少可演示用户或空闲车辆，请先检查用户和设备数据')
        return
      }

      const response = await http.post('/orders/start', {
        user_id: user.id,
        equipment_id: equipment.id
      })
      setFlowMessage(`已创建演示订单 ${response.data?.order_no || ''}，车辆 ${equipment.equipment_code} 已借出`)
      await reload()
    } catch (error) {
      setFlowMessage(error.message)
    }
  }

  async function forceReturn(record, reload) {
    setFlowMessage('')
    setReturnError('')
    setReturnRecord(record)
    setReturnStationId(record.end_station_id ? String(record.end_station_id) : '')
    setSimulatedMinutes('12')
    setStationKeyword('')
    returnReloadRef.current = reload
    setReturnModalOpen(true)
  }

  function closeReturnModal() {
    if (returnSaving) return
    setReturnModalOpen(false)
    setReturnRecord(null)
    setReturnStationId('')
    setSimulatedMinutes('12')
    setStationKeyword('')
    setReturnError('')
    returnReloadRef.current = null
  }

  async function submitReturn() {
    if (!returnRecord) return
    if (!returnStationId) {
      setReturnError('请选择归还站点')
      return
    }
    const minutes = Number(simulatedMinutes)
    if (!Number.isFinite(minutes) || minutes <= 0) {
      setReturnError('请输入有效的模拟骑行时长')
      return
    }

    setReturnSaving(true)
    setReturnError('')
    try {
      const reloadAfterReturn = returnReloadRef.current
      const response = await http.put(`/orders/${returnRecord.id}/return`, {
        end_station_id: Number(returnStationId),
        simulated_minutes: minutes
      })
      const result = response.data || {}
      closeReturnModal()
      await reloadAfterReturn?.()
      setFlowMessage(`订单 ${returnRecord.order_no || ''} 已还到站点 #${result.end_station_id || returnStationId}，模拟 ${result.ride_minutes || minutes} 分钟，计费 ¥${Number(result.actual_amount || 0).toFixed(2)}，列表已自动刷新`)
    } catch (error) {
      setReturnError(error.message)
    } finally {
      setReturnSaving(false)
    }
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
          allowCreate={false}
          allowDelete={false}
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
            if (key === 'user_id') return userNameById[String(value)] || `用户 #${value}`
            if (key === 'equipment_id') return equipCodeById[String(value)] || `设备 #${value}`
            if (key === 'start_station_id' || key === 'end_station_id') {
              const station = stations.find((item) => Number(item.id) === Number(value))
              return station?.station_name || `站点 #${value}`
            }
            if (key === 'expected_amount' || key === 'actual_amount') return `¥${Number(value).toFixed(2)}`
            if (key === 'order_status') return formatStatus(value)
            return String(value)
          }}
          rowActions={(record, { reload }) => (
            <>
              {record.order_status !== 'completed' && record.order_status !== 'cancelled' ? (
                <button className="inline-btn primary" type="button" onClick={() => forceReturn(record, reload)}>
                  还车计费
                </button>
              ) : null}
              {record.order_status !== 'completed' && record.order_status !== 'cancelled' ? (
                <button className="inline-btn warn" type="button" onClick={() => cancelOrder(record, reload)}>
                  取消
                </button>
              ) : null}
              <button className="inline-btn ghost" type="button" onClick={() => goToTransactions(record)}>
                流水
              </button>
            </>
          )}
          toolbarActions={({ reload }) => (
            <button className="primary-btn" type="button" onClick={() => startDemoOrder(reload)}>
              演示下单：自动借出空闲车辆
            </button>
          )}
          helperText={flowMessage}
        />

        {returnModalOpen ? createPortal(
          <div className="modal-backdrop" role="presentation" onClick={closeReturnModal}>
            <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
              <div className="modal-head">
                <h4>还车计费</h4>
                <button className="ghost-btn" type="button" onClick={closeReturnModal}>关闭</button>
              </div>

              <div className="status-text">
                为订单 {returnRecord?.order_no || '--'} 选择归还站点和模拟骑行时长，提交后会写入终点站、还车时间、金额和车辆状态。
              </div>

              <div className="crud-form">
                <label className="crud-field">
                  <span>搜索站点</span>
                  <input
                    type="search"
                    value={stationKeyword}
                    placeholder="输入站点名称、编号或地址筛选"
                    onChange={(event) => setStationKeyword(event.target.value)}
                  />
                </label>

                <label className="crud-field">
                  <span>归还站点</span>
                  <select value={returnStationId} onChange={(event) => setReturnStationId(event.target.value)}>
                    <option value="">请选择站点</option>
                    {filteredStations.map((station) => (
                      <option key={station.id} value={String(station.id)}>
                        {station.station_name || station.station_code || `站点 #${station.id}`}
                        {station.station_code ? `（${station.station_code}）` : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="crud-field">
                  <span>模拟骑行时长（分钟）</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={simulatedMinutes}
                    placeholder="例如 12、30、60"
                    onChange={(event) => setSimulatedMinutes(event.target.value)}
                  />
                </label>

                {stations.length > 0 && filteredStations.length === 0 ? (
                  <div className="empty-state">没有匹配的站点，请调整搜索条件</div>
                ) : null}

                {returnError ? <div className="empty-state error">{returnError}</div> : null}

                <div className="modal-actions">
                  <button className="primary-btn" type="button" onClick={submitReturn} disabled={returnSaving}>
                    {returnSaving ? '提交中...' : '确认还车'}
                  </button>
                  <button className="ghost-btn" type="button" onClick={closeReturnModal} disabled={returnSaving}>
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        ) : null}
      </AppShell>
    </AuthGuard>
  )
}
