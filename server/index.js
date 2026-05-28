import dotenv from 'dotenv'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env') })

import express from 'express'
import cors from 'cors'
import chatRoutes from './routes/chat.js'
import exportRoutes from './routes/export.js'
import characterRoutes from './routes/character.js'
import { errorHandler } from './middleware/errorHandler.js'
const app = express()
const PORT = process.env.SERVER_PORT || 3001

app.use(cors())
app.use(express.json({ limit: '1mb' }))

// Static audio files
app.use('/audio', express.static(join(__dirname, 'public', 'audio')))

// API routes
app.use('/api', chatRoutes)
app.use('/api', exportRoutes)
app.use('/api', characterRoutes)

// Error handler
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
