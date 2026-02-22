import { DataAPIClient } from '@datastax/astra-db-ts'

const endpoint = process.env.VITE_ASTRA_DB_API_ENDPOINT || process.env.ASTRA_DB_API_ENDPOINT
const token = process.env.VITE_ASTRA_DB_APPLICATION_TOKEN || process.env.ASTRA_DB_APPLICATION_TOKEN
const KEYSPACE = 'default_keyspace'

if (!endpoint || !token) {
  console.warn('Astra DB credentials not configured. Using in-memory fallback.')
}

let database = null

export async function getDatabase() {
  if (!endpoint || !token) {
    return null
  }
  if (database) return database
  try {
    const client = new DataAPIClient()
    database = client.db(endpoint, { token })
    return database
  } catch (err) {
    console.error('Astra DB connection error:', err?.message || err)
    return null
  }
}

export async function ensureCollections() {
  const db = await getDatabase()
  if (!db) return false
  try {
    const collections = await db.listCollections({ nameOnly: true })
    const names = (Array.isArray(collections) ? collections : []).map(c => c?.name).filter(Boolean)
    if (!names.includes('users')) {
      await db.createCollection('users')
    }
    if (!names.includes('transactions')) {
      await db.createCollection('transactions')
    }
    return true
  } catch (err) {
    console.error('Astra DB setup error:', err.message)
    return false
  }
}

export { KEYSPACE }
