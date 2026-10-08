function Welcome({ user, onLogout }) {
  return (
    <main className="mx-auto mt-16 w-full max-w-md rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-2xl font-semibold">Welcome, {user.name}!</h1>
      <p className="mt-2 text-neutral-600">You are logged in as {user.email}.</p>
      <button onClick={onLogout} className="mt-6 rounded-lg border border-neutral-300 px-4 py-2 hover:bg-neutral-100">Log out</button>
    </main>
  )
}

export default Welcome
