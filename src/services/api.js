const API_BASE = '/api'

function getHeaders(user) {
  const headers = { 'Content-Type': 'application/json' }
  if (user?.email) {
    headers['X-User-Email'] = user.email
  }
  return headers
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Login failed')
  return data.user
}

export async function signup(email, password, fullName) {
  let res
  try {
    res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName }),
    })
  } catch (err) {
    throw new Error('Cannot reach server. Is the app running? Start with: npm run dev')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Signup failed')
  return data.user
}

export async function getAccount(user) {
  const res = await fetch(`${API_BASE}/account?email=${encodeURIComponent(user.email)}`, {
    headers: getHeaders(user),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to fetch account')
  return data
}

export async function getBalance(user) {
  const res = await fetch(`${API_BASE}/balance?email=${encodeURIComponent(user.email)}`, {
    headers: getHeaders(user),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to fetch balance')
  return data.balance
}

export async function getTransactions(user) {
  const res = await fetch(`${API_BASE}/transactions?email=${encodeURIComponent(user.email)}`, {
    headers: getHeaders(user),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to fetch transactions')
  return data.transactions || []
}
