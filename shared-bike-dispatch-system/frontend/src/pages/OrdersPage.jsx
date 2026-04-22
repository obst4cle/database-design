import ResourcePage from '../components/ResourcePage'
import { AppShell, AuthGuard } from '../components/Layout'

export default function OrdersPage() {
  return (
    <AuthGuard>
      <AppShell title="订单管理" subtitle="查看租借、归还和计费结果。">
        <ResourcePage
          title="订单列表"
          description="用于展示订单主线数据。"
          apiPath="/orders"
          columns={["order_no", "user_id", "expected_amount", "order_status"]}
        />
      </AppShell>
    </AuthGuard>
  )
}
