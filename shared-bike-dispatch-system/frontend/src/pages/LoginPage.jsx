import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import http from '../api/http'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ account: '', password: '' })
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    try {
      const response = await http.post('/auth/login', form)
      localStorage.setItem('token', response.data.token)
      navigate('/dashboard')
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-wrapper">
        <div className="auth-brand-side">
          <div className="bike-illus">🚲</div>
          <h2>智能共享单车</h2>
          <p>新一代城市出行管理后台。提供高效的车辆调度、订单实时追踪与智慧运维服务，打造绿色出行新体验。</p>
        </div>
        <div className="auth-form-side">
          <h1>👏 欢迎登录</h1>
          <p className="auth-subtitle">请使用您的管理员或总控账号登录</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              账号
              <input
                value={form.account}
                onChange={(event) => setForm((state) => ({ ...state, account: event.target.value }))}
                placeholder="用户名或手机号"
              />
            </label>
            <label>
              密码
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((state) => ({ ...state, password: event.target.value }))}
                placeholder="请输入密码"
              />
            </label>
            <button className="primary-btn full" type="submit" style={{ marginTop: '12px' }}>进入系统</button>
            {message ? <p className="form-message">{message}</p> : null}
            <p className="auth-switch">
              没有系统账号？ <Link to="/register">立即注册</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
