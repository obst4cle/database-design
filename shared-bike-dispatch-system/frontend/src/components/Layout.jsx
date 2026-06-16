import { NavLink, Navigate, useNavigate } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', label: '运营看板' },
  { to: '/users', label: '会员管理' },
  { to: '/user-ranks', label: '会员等级' },
  { to: '/stations', label: '站点管理' },
  { to: '/equipments', label: '车辆设备' },
  { to: '/orders', label: '订单大厅' },
  { to: '/transactions', label: '财务流水' },
  { to: '/coupons', label: '营销活动' },
  { to: '/staffs', label: '调度人员' },
  { to: '/maintenance-logs', label: '维修记录' },
  { to: '/dispatch-tasks', label: '调度工单' },
  { to: '/operations', label: '调度与售后' }
]

export function AuthGuard({ children }) {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

export function AppShell({ title, children }) {
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-badge">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="5.5" cy="17.5" r="3.5"/>
              <circle cx="18.5" cy="17.5" r="3.5"/>
              <path d="M15 6l-3 5h4l-3 5"/>
              <circle cx="9" cy="6" r="1.5"/>
              <path d="M9 6l-4 5.5"/>
              <path d="M15 6l3 3"/>
            </svg>
          </div>
          <div>
            <h1>共享单车调度系统</h1>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <h2>{title}</h2>
          <button className="ghost-btn" type="button" onClick={handleLogout}>
            退出登录
          </button>
        </header>

        <section className="content-area">{children}</section>
      </main>
    </div>
  )
}
