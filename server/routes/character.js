import { Router } from 'express'
import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CONFIG_PATH = join(__dirname, '..', '..', 'character.json')

let cached = null

async function loadCharacter() {
  if (cached) return cached
  const raw = await readFile(CONFIG_PATH, 'utf-8')
  cached = JSON.parse(raw)
  return cached
}

const router = Router()

router.get('/character', async (req, res) => {
  try {
    const config = await loadCharacter()
    res.json(config)
  } catch (err) {
    res.status(500).json({ error: 'Failed to load character config' })
  }
})

export default router
