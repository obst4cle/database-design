import ResourcePage from '../components/ResourcePage'
import { AppShell, AuthGuard } from '../components/Layout'

export default function UsersPage() {
  return (
    <AuthGuard>
      <AppShell title="用户">
        <ResourcePage
          title="用户列表"
          apiPath="/users"
          columns={['username', 'phone', 'credit_score', 'account_status']}
        />
      </AppShell>
    </AuthGuard>
  )
}
