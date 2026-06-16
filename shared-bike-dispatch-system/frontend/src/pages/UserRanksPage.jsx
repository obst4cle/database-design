import { AppShell, AuthGuard } from '../components/Layout'
import CrudManagerPage from '../components/CrudManagerPage'

const rankFields = [
  { name: 'rank_code', label: '等级编码', required: true },
  { name: 'rank_name', label: '等级名称', required: true },
  { name: 'discount_rate', label: '折扣率', type: 'number', step: '0.01', required: true },
  { name: 'deposit_amount', label: '押金', type: 'number', step: '0.01', required: true },
  { name: 'description', label: '描述', type: 'textarea', rows: 2 }
]

const rankColumns = [
  { key: 'rank_code', label: '等级编码' },
  { key: 'rank_name', label: '等级名称' },
  { key: 'discount_rate', label: '折扣率' },
  { key: 'deposit_amount', label: '押金' },
  { key: 'description', label: '描述' }
]

export default function UserRanksPage() {
  return (
    <AuthGuard>
      <AppShell title="会员等级">
        <CrudManagerPage
          title="会员等级列表"
          apiPath="/user-ranks"
          columns={rankColumns}
          fields={rankFields}
          createLabel="新增等级"
          helperText="管理会员等级体系，折扣率 1.00 = 无折扣，0.80 = 八折。用户表通过 rank_id 关联。"
          defaultValues={{ discount_rate: 1.00, deposit_amount: 0 }}
          mapRecordToForm={(record) => ({
            rank_code: record.rank_code ?? '',
            rank_name: record.rank_name ?? '',
            discount_rate: record.discount_rate ?? 1.00,
            deposit_amount: record.deposit_amount ?? 0,
            description: record.description ?? ''
          })}
          buildCreatePayload={(formValues) => ({
            ...formValues,
            discount_rate: Number(formValues.discount_rate),
            deposit_amount: Number(formValues.deposit_amount)
          })}
          buildUpdatePayload={(formValues) => ({
            ...formValues,
            discount_rate: Number(formValues.discount_rate),
            deposit_amount: Number(formValues.deposit_amount)
          })}
          formatValue={(value, row, key) => {
            if (value === null || value === undefined || value === '') return '--'
            if (key === 'discount_rate') return `${Number(value).toFixed(2)}x`
            if (key === 'deposit_amount') return `¥${Number(value).toFixed(2)}`
            return String(value)
          }}
        />
      </AppShell>
    </AuthGuard>
  )
}
