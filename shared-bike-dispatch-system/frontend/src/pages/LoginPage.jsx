import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
      <section className="auth-card">
        <span className="eyebrow">Shared Bike Dispatch</span>
        <h1>共享单车调度管理系统</h1>
        <p>登录后可查看看板、订单、网点、设备和调度任务。</p>

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
          <button className="primary-btn full" type="submit">登录</button>
          {message ? <p className="form-message">{message}</p> : null}
        </form>
      </section>
    </div>
  )
}
