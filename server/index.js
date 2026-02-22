import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Load .env from project root (works when running via npm run dev from project root)
dotenv.config({ path: path.resolve(process.cwd(), '.env') })
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

import express from 'express'
import cors from 'cors'
import { authRoutes } from './routes/auth.js'
import { accountRoutes } from './routes/account.js'
import { adminRoutes } from './routes/admin.js'

const app = express()
const PORT = process.env.PORT || 5070

app.use(cors({ origin: true }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api', accountRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`LetsBank API running on http://localhost:${PORT}`)
})
