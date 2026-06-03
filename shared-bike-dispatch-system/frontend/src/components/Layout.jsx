import { NavLink, Navigate, useNavigate } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', label: '运营看板' },
  { to: '/users', label: '会员管理' },
  { to: '/stations', label: '站点管理' },
  { to: '/equipments', label: '车辆设备' },
  { to: '/orders', label: '订单大厅' },
  { to: '/transactions', label: '财务流水' },
  { to: '/coupons', label: '营销活动' },
  { to: '/staffs', label: '调度人员' },
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
          <div className="brand-badge">SB</div>
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
