const users = new Map()
const transactions = new Map()

function generateId() {
  return 'LB' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).toUpperCase().slice(2, 8)
}

function normalizeName(name) {
  return (name || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase()
}

export const memoryStore = {
  async findUserByEmail(email) {
    const key = normalizeEmail(email)
    if (!key) return null
    for (const [e, user] of users) {
      if (normalizeEmail(e) === key) return user
    }
    return null
  },
  async findUserByFullName(fullName) {
    const needle = normalizeName(fullName)
    if (!needle) return null
    for (const user of users.values()) {
      if (normalizeName(user.fullName) === needle) return user
    }
    return null
  },
  async findUserByAccountId(accountId) {
    const id = (accountId || '').trim().toUpperCase()
    if (!id) return null
    for (const user of users.values()) {
      if ((user.accountId || '').toUpperCase() === id) return user
    }
    return null
  },
  async createUser({ email, password, fullName }) {
    const DEFAULT_BALANCE = 50000
    const accountId = generateId()
    const key = normalizeEmail(email) || email
    const user = {
      email: key,
      password,
      fullName,
      accountId,
      balance: DEFAULT_BALANCE,
      createdAt: new Date().toISOString(),
    }
    users.set(key, user)
    const tx = {
      _id: generateId(),
      userEmail: user.email,
      amount: DEFAULT_BALANCE,
      type: 'credit',
      description: 'Opening balance',
      timestamp: new Date().toISOString(),
    }
    transactions.set(tx._id, tx)
    return user
  },
  async creditUser(fullName, amount, description = 'Credit') {
    const user = await this.findUserByFullName(fullName)
    if (!user) return null
    return this._creditUser(user, amount, description)
  },
  async creditUserByAccountId(accountId, amount, description = 'Credit') {
    const user = await this.findUserByAccountId(accountId)
    if (!user) return null
    return this._creditUser(user, amount, description)
  },
  _creditUser(user, amount, description) {
    const amt = Number(amount)
    user.balance = (user.balance ?? 0) + amt
    const tx = {
      _id: generateId(),
      userEmail: user.email,
      amount: amt,
      type: 'credit',
      description,
      timestamp: new Date().toISOString(),
    }
    transactions.set(tx._id, tx)
    return user
  },
  async findUserTransactions(email) {
    const all = Array.from(transactions.values()).filter((t) => t.userEmail === email)
    return all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  },
  getMapKeyForEmail(email) {
    const key = normalizeEmail(email)
    if (!key) return null
    for (const e of users.keys()) {
      if (normalizeEmail(e) === key) return e
    }
    return null
  },
  async deleteUserByEmail(email) {
    const key = this.getMapKeyForEmail(email)
    if (!key) return false
    users.delete(key)
    for (const [txId, tx] of transactions) {
      if (normalizeEmail(tx.userEmail) === normalizeEmail(email)) transactions.delete(txId)
    }
    return true
  },
}
