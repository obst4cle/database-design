import ResourcePage from '../components/ResourcePage'
import { AppShell, AuthGuard } from '../components/Layout'

export default function CouponsPage() {
  return (
    <AuthGuard>
      <AppShell title="优惠营销" subtitle="管理优惠券发放、核销和过期状态。">
        <ResourcePage
          title="优惠券列表"
          description="用于展示营销和核销数据。"
          apiPath="/coupons"
          columns={["coupon_code", "coupon_name", "face_value", "is_used"]}
        />
      </AppShell>
    </AuthGuard>
  )
}
