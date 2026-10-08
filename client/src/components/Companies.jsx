import { useEffect, useState } from 'react'

function Companies() {
  const [companies, setCompanies] = useState([])
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const token = localStorage.getItem('token')

  useEffect(() => {
    fetch('/api/companies', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setCompanies(data.companies || []))
  }, [token])

  async function handleAdd(e) {
    e.preventDefault()
    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, role }),
    })
    const data = await res.json()
    if (!res.ok) {
      alert(data.message || 'Could not add company')
      return
    }
    setCompanies([data.company, ...companies])
    setName('')
    setRole('')
  }

  return (
    <main className="mx-auto mt-10 w-full max-w-2xl px-4">
      <h1 className="text-2xl font-semibold">Your companies</h1>

      <form onSubmit={handleAdd} className="mt-4 flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Company name" className="flex-1 rounded-lg border border-neutral-300 px-3 py-2" />
        <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role" className="flex-1 rounded-lg border border-neutral-300 px-3 py-2" />
        <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 text-white">Add</button>
      </form>

      <ul className="mt-6 space-y-2">
        {companies.map((company) => (
          <li key={company._id} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="font-medium">{company.name}</p>
            <p className="text-sm text-neutral-600">{company.role || 'No role set'} · {company.status}</p>
          </li>
        ))}
        {companies.length === 0 && <p className="text-neutral-500">No companies yet.</p>}
      </ul>
    </main>
  )
}

export default Companies
