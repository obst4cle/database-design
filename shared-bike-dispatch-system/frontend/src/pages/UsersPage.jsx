import ResourcePage from '../components/ResourcePage'
import { AppShell, AuthGuard } from '../components/Layout'

export default function UsersPage() {
  return (
    <AuthGuard>
      <AppShell title="用户中心" subtitle="用户信息、信用积分和会员等级管理。">
        <ResourcePage
          title="用户列表"
          description="后续可直接对接用户 CRUD 接口。"
          apiPath="/users"
          columns={["username", "phone", "credit_score", "account_status"]}
        />
      </AppShell>
    </AuthGuard>
  )
}
