import { Router } from 'express'
import { memoryStore } from '../db/store.js'

const router = Router()

router.delete('/user', async (req, res) => {
  try {
    const email = req.query.email || req.body?.email
    if (!email) {
      return res.status(400).json({ error: 'email is required (query or body)' })
    }
    const deleted = await memoryStore.deleteUserByEmail(email)
    if (!deleted) {
      return res.status(404).json({ error: `User not found: ${email}` })
    }
    res.json({ message: `User ${email} deleted` })
  } catch (err) {
    console.error('Admin delete user error:', err)
    res.status(500).json({ error: err?.message || 'Delete failed' })
  }
})

router.post('/user', async (req, res) => {
  try {
    const { email, password, fullName } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }
    const existing = await memoryStore.findUserByEmail(email)
    if (existing) {
      return res.status(409).json({ error: 'User with this email already exists' })
    }
    const user = await memoryStore.createUser({
      email: email.trim(),
      password,
      fullName: fullName || email.split('@')[0] || 'User',
    })
    const { password: _, ...account } = user
    res.status(201).json({ message: 'User created', user: account })
  } catch (err) {
    console.error('Admin create user error:', err)
    res.status(500).json({ error: err?.message || 'Create failed' })
  }
})

router.post('/credit-by-account', async (req, res) => {
  try {
    const { accountId, amount } = req.body
    const amt = Number(amount)
    if (!accountId || !Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ error: 'accountId and a positive amount are required' })
    }
    const user = await memoryStore.creditUserByAccountId(accountId.trim().toUpperCase(), amt, 'Credit')
    if (!user) {
      return res.status(404).json({ error: `Account not found: ${accountId}` })
    }
    const { password, ...account } = user
    res.json({ message: `₹${amt} credited to account ${user.accountId}`, user: account })
  } catch (err) {
    console.error('Admin credit-by-account error:', err)
    res.status(500).json({ error: err?.message || 'Credit failed' })
  }
})

router.post('/credit', async (req, res) => {
  try {
    const { fullName, amount, createIfMissing } = req.body
    const amt = Number(amount)
    if (!fullName || !Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ error: 'fullName and a positive amount are required' })
    }
    let user = await memoryStore.findUserByFullName(fullName)
    if (!user && createIfMissing) {
      const email = (fullName.toLowerCase().trim().replace(/\s+/g, '.') + '@letsbank.local').replace(/\.+/g, '.')
      await memoryStore.createUser({
        email,
        password: 'change-me',
        fullName: fullName.trim().replace(/\b\w/g, (c) => c.toUpperCase()),
      })
    }
    user = await memoryStore.creditUser(fullName, amt, 'Credit')
    if (!user) {
      return res.status(404).json({
        error: `User "${fullName}" not found. Sign up first with that full name, or use "createIfMissing": true.`,
      })
    }
    const { password, ...account } = user
    res.json({ message: `₹${amt} credited to ${user.fullName}`, user: account })
  } catch (err) {
    console.error('Admin credit error:', err)
    res.status(500).json({ error: err?.message || 'Credit failed' })
  }
})

export const adminRoutes = router
