import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
        <span className="eyebrow">Shared Bike Dispatch</span>
        <h1>用户注册</h1>
        <p>请填写信息创建新用户。</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            用户名
            <input value={form.username} onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} placeholder="用户名" />
          </label>
          <label>
            手机号
            <input value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} placeholder="手机号" />
          </label>
          <label>
            密码
            <input type="password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} placeholder="密码" />
          </label>
          <label>
            真实姓名（可选）
            <input value={form.real_name} onChange={(e) => setForm((s) => ({ ...s, real_name: e.target.value }))} placeholder="真实姓名" />
          </label>
          <button className="primary-btn full" type="submit">注册</button>
          {message ? <p className="form-message">{message}</p> : null}
        </form>
      </section>
    </div>
  )
}
