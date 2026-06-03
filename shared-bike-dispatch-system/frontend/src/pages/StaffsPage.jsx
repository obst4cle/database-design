import { AppShell, AuthGuard } from '../components/Layout'
import CrudManagerPage from '../components/CrudManagerPage'

const jobTitleOptions = [
  { value: 'dispatcher', label: '调度员' },
  { value: 'maintainer', label: '维修员' },
  { value: 'manager', label: '区域主管' }
]

const statusOptions = [
  { value: 'active', label: '在岗' },
  { value: 'leave', label: '休假' },
  { value: 'resigned', label: '离职' }
]

const staffFields = [
  { name: 'staff_code', label: '工号', required: true },
  { name: 'staff_name', label: '姓名', required: true },
  { name: 'phone', label: '电话', required: true },
  { name: 'district', label: '负责片区', required: true },
  { name: 'job_title', label: '职务', type: 'select', required: true, options: jobTitleOptions },
  { name: 'staff_status', label: '状态', type: 'select', required: true, options: statusOptions },
  { name: 'hired_at', label: '入职日期', type: 'date' }
]

const staffColumns = [
  { key: 'staff_code', label: '工号' },
  { key: 'staff_name', label: '姓名' },
  { key: 'phone', label: '电话' },
  { key: 'district', label: '负责片区' },
  { key: 'job_title', label: '职务' },
  { key: 'staff_status', label: '状态' },
  { key: 'hired_at', label: '入职日期' }
]

function formatJobTitle(value) {
  return jobTitleOptions.find((item) => item.value === value)?.label || String(value)
}

function formatStatus(value) {
  return statusOptions.find((item) => item.value === value)?.label || String(value)
}

export default function StaffsPage() {
  return (
    <AuthGuard>
      <AppShell title="调度人员">
        <CrudManagerPage
          title="调度人员列表"
          apiPath="/staffs"
          columns={staffColumns}
          fields={staffFields}
          createLabel="新增人员"
          helperText="管理一线调度与维修人员。调度工单会自动派给在岗人员。"
          defaultValues={{ job_title: 'dispatcher', staff_status: 'active' }}
          mapRecordToForm={(record) => ({
            staff_code: record.staff_code ?? '',
            staff_name: record.staff_name ?? '',
            phone: record.phone ?? '',
            district: record.district ?? '',
            job_title: record.job_title ?? 'dispatcher',
            staff_status: record.staff_status ?? 'active',
            hired_at: record.hired_at ? String(record.hired_at).slice(0, 10) : ''
          })}
          buildCreatePayload={(formValues) => ({
            ...formValues,
            hired_at: formValues.hired_at || null
          })}
          buildUpdatePayload={(formValues) => ({
            ...formValues,
            hired_at: formValues.hired_at || null
          })}
          formatValue={(value, row, key) => {
            if (value === null || value === undefined || value === '') return '--'
            if (key === 'job_title') return formatJobTitle(value)
            if (key === 'staff_status') return formatStatus(value)
            if (key === 'hired_at') return String(value).slice(0, 10)
            return String(value)
          }}
        />
      </AppShell>
    </AuthGuard>
  )
}
