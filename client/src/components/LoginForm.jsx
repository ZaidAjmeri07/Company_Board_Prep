import { useState } from 'react'
import { Link } from 'react-router-dom'

function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.message || 'Login failed')
      } else {
        onLogin(data.user, data.token)
      }
    } catch {
      alert('Could not reach the server')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-16 flex w-full max-w-sm flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold">Log in</h1>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded-lg border border-neutral-300 px-3 py-2" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="rounded-lg border border-neutral-300 px-3 py-2" />
      <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-800">Log in</button>
      <p className="text-sm text-neutral-600">No account? <Link to="/register" className="text-emerald-700 underline">Create one</Link></p>
    </form>
  )
}

export default LoginForm
