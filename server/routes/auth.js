import { Router } from 'express'
import { getDatabase, ensureCollections } from '../db/astra.js'
import { memoryStore } from '../db/store.js'

const router = Router()

export const authRoutes = router

const ASTRA_TIMEOUT_MS = 8000

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Astra timeout')), ms)),
  ])
}

async function signupWithAstra(db, { email, password, fullName }) {
  await withTimeout(ensureCollections(), ASTRA_TIMEOUT_MS)
  const users = db.collection('users')
  const existing = await withTimeout(users.findOne({ email }), ASTRA_TIMEOUT_MS)
  if (existing) return { error: 'Email already registered', status: 409 }
  const accountId = 'LB' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).toUpperCase().slice(2, 8)
  const user = { email, password, fullName, accountId, balance: 50000, createdAt: new Date().toISOString() }
  await withTimeout(users.insertOne(user), ASTRA_TIMEOUT_MS)
  return { user }
}

async function loginWithAstra(db, { email, password }) {
  const users = db.collection('users')
  const user = await withTimeout(users.findOne({ email }), ASTRA_TIMEOUT_MS)
  if (!user || user.password !== password) return { error: 'Invalid email or password', status: 401 }
  return { user }
}

router.post('/signup', async (req, res) => {
  const { email, password, fullName } = req.body
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Email, password, and full name are required' })
  }

  try {
    // Use memory store first so signup always works (Astra can't block it)
    const existing = await memoryStore.findUserByEmail(email)
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' })
    }
    const user = await memoryStore.createUser({ email, password, fullName })
    const { password: _, ...userWithoutPassword } = user
    res.status(201).json({ user: userWithoutPassword })

    // Optionally sync to Astra in background (don't block or fail the response)
    const db = await getDatabase()
    if (db) {
      signupWithAstra(db, { email, password, fullName }).catch((err) => {
        console.warn('Astra signup sync failed (user was created in memory):', err?.message || err)
      })
    }
  } catch (err) {
    console.error('Signup error:', err)
    res.status(500).json({ error: err?.message || 'Signup failed' })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  let sent = false
  const send = (status, body) => {
    if (sent) return
    sent = true
    res.status(status).json(body)
  }

  try {
    // Try memory store first so in-memory users (e.g. created via admin credit) always work
    const memoryUser = await memoryStore.findUserByEmail(email)
    if (memoryUser && memoryUser.password === password) {
      const { password: _, ...u } = memoryUser
      return send(200, { user: u })
    }

    const db = await getDatabase()
    if (db) {
      try {
        const result = await loginWithAstra(db, { email, password })
        if (result.error) return send(result.status, { error: result.error })
        const { password: _, ...u } = result.user
        return send(200, { user: u })
      } catch (err) {
        console.warn('Astra login failed:', err?.message || err)
      }
    }

    send(401, { error: 'Invalid email or password' })
  } catch (err) {
    console.error('Login error:', err)
    send(500, { error: err?.message || 'Login failed' })
  }
})
