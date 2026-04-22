import { NavLink, Navigate, useNavigate } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', label: '首页看板' },
  { to: '/users', label: '用户中心' },
  { to: '/stations', label: '网点管理' },
  { to: '/equipments', label: '设备管理' },
  { to: '/orders', label: '订单管理' },
  { to: '/coupons', label: '优惠营销' },
  { to: '/operations', label: '运维调度' }
]

export function AuthGuard({ children }) {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

export function AppShell({ title, subtitle, children }) {
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
            <h1>共享单车调度管理系统</h1>
            <p>React + Express + MySQL</p>
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
          <div>
            <span className="eyebrow">课程实验项目</span>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button className="ghost-btn" type="button" onClick={handleLogout}>
            退出登录
          </button>
        </header>

        <section className="content-area">{children}</section>
      </main>
    </div>
  )
}

export function PageFrame({ title, description, children }) {
  return (
    <section className="page-frame">
      <div className="page-head">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {children}
    </section>
  )
}
