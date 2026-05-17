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
      <section className="auth-card">
        <h1>注册账号</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            用户名
            <input value={form.username} onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} placeholder="请输入用户名" />
          </label>
          <label>
            手机号
            <input value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} placeholder="请输入手机号" />
          </label>
          <label>
            密码
            <input type="password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} placeholder="请输入密码" />
          </label>
          <label>
            真实姓名
            <input value={form.real_name} onChange={(e) => setForm((s) => ({ ...s, real_name: e.target.value }))} placeholder="可选" />
          </label>
          <button className="primary-btn full" type="submit">注册</button>
          {message ? <p className="form-message">{message}</p> : null}
          <p className="auth-switch">
            已有账号？ <Link to="/login">去登录</Link>
          </p>
        </form>
      </section>
    </div>
  )
}
