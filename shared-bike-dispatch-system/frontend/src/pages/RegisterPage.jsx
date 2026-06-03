import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import http from '../api/http'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '', phone: '', real_name: '' })
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    try {
      await http.post('/auth/register', form)
      navigate('/login')
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
          <p>加入我们的管理体系，体验实时车辆分布总览与快速智能调度推荐服务。</p>
        </div>
        <div className="auth-form-side">
          <h1 style={{ fontSize: '28px' }}>🚀 注册控制台账号</h1>
          
          <form className="auth-form" onSubmit={handleSubmit} style={{ marginTop: '12px' }}>
            <label>
              用户名
              <input value={form.username} onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} placeholder="请输入唯一用户名" />
            </label>
            <label>
              手机号
              <input value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} placeholder="用于登录与密码找回" />
            </label>
            <label>
              密码
              <input type="password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} placeholder="至少 6 位密码" />
            </label>
            <label>
              真实姓名
              <input value={form.real_name} onChange={(e) => setForm((s) => ({ ...s, real_name: e.target.value }))} placeholder="选填，建议实名" />
            </label>
            <button className="primary-btn full" type="submit" style={{ marginTop: '12px' }}>立即注册</button>
            {message ? <p className="form-message">{message}</p> : null}
            <p className="auth-switch">
              已有账号？ <Link to="/login">返回登录</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
