import { Router } from 'express'
import { getDatabase } from '../db/astra.js'
import { memoryStore } from '../db/store.js'

const router = Router()

function getUserIdFromRequest(req) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null
  try {
    const payload = JSON.parse(Buffer.from(authHeader.slice(7).split('.')[1], 'base64').toString())
    return payload.email
  } catch {
    return null
  }
}

router.use((req, res, next) => {
  const userEmail = req.headers['x-user-email']
  if (userEmail) {
    req.userEmail = userEmail
  }
  next()
})

router.get('/account', async (req, res) => {
  try {
    const email = req.userEmail || req.query.email
    if (!email) return res.status(401).json({ error: 'User not authenticated' })

    const db = await getDatabase()
    if (db) {
      try {
        const users = db.collection('users')
        const user = await users.findOne({ email })
        if (user) {
          const { password, ...account } = user
          return res.json(account)
        }
      } catch (err) {
        console.warn('Astra account fetch failed:', err.message)
      }
    }

    const user = await memoryStore.findUserByEmail(email)
    if (!user) return res.status(404).json({ error: 'User not found' })
    const { password, ...account } = user
    res.json(account)
  } catch (err) {
    console.error('Account error:', err)
    res.status(500).json({ error: 'Failed to fetch account' })
  }
})

router.get('/balance', async (req, res) => {
  try {
    const email = req.userEmail || req.query.email
    if (!email) return res.status(401).json({ error: 'User not authenticated' })

    const db = await getDatabase()
    if (db) {
      try {
        const users = db.collection('users')
        const user = await users.findOne({ email })
        if (user) return res.json({ balance: user.balance ?? 0 })
      } catch (err) {
        console.warn('Astra balance fetch failed:', err.message)
      }
    }

    const user = await memoryStore.findUserByEmail(email)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ balance: user.balance ?? 0 })
  } catch (err) {
    console.error('Balance error:', err)
    res.status(500).json({ error: 'Failed to fetch balance' })
  }
})

router.get('/transactions', async (req, res) => {
  try {
    const email = req.userEmail || req.query.email
    if (!email) return res.status(401).json({ error: 'User not authenticated' })

    const db = await getDatabase()
    if (db) {
      try {
        const transactions = db.collection('transactions')
        const cursor = transactions.find({ userEmail: email })
        const docs = await cursor.toArray()
        docs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
        return res.json({ transactions: docs })
      } catch (err) {
        console.warn('Astra transactions fetch failed:', err.message)
      }
    }

    const docs = await memoryStore.findUserTransactions(email)
    res.json({ transactions: docs })
  } catch (err) {
    console.error('Transactions error:', err)
    res.status(500).json({ error: 'Failed to fetch transactions' })
  }
})

export const accountRoutes = router
