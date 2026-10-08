import { useState } from 'react'
import { Link } from 'react-router-dom'

function RegisterForm({ onRegister }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.message || 'Registration failed')
      } else {
        onRegister(data.user, data.token)
      }
    } catch {
      alert('Could not reach the server')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-16 flex w-full max-w-sm flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold">Create account</h1>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="rounded-lg border border-neutral-300 px-3 py-2" />
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded-lg border border-neutral-300 px-3 py-2" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (8+ chars)" className="rounded-lg border border-neutral-300 px-3 py-2" />
      <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-800">Register</button>
      <p className="text-sm text-neutral-600">Have an account? <Link to="/login" className="text-emerald-700 underline">Log in</Link></p>
    </form>
  )
}

export default RegisterForm
