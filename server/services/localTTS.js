import { execFile } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SOVITS = 'D:/GPT-SoVITS/GPT-SoVITS-v3lora-20250228'
const PYTHON = `${SOVITS}/runtime/python.exe`
const AUDIO_DIR = join(__dirname, '..', 'public', 'audio')
const TMP = process.env.TEMP || 'C:/Windows/Temp'

export async function synthesizeSpeech(text) {
  if (!text) throw new Error('TTS: empty')
  const id = randomUUID()
  const filename = `${id}.wav`
  const outPath = join(AUDIO_DIR, filename)
  const inFile = join(TMP, `tts_in_${id}.txt`)
  await mkdir(AUDIO_DIR, { recursive: true })
  await writeFile(inFile, text, 'utf-8')

  return new Promise((resolve, reject) => {
    execFile(PYTHON, [`${SOVITS}/tts_one.py`, inFile, outPath], {
      timeout: 120000, maxBuffer: 1024 * 1024, cwd: SOVITS,
    }, (err, stdout) => {
      if (err) return reject(new Error(`TTS: ${err.message}`))
      const out = stdout.trim()
      if (out.startsWith('OK:')) {
        const [, , dur] = out.split(':')
        console.log(`[TTS] ${dur} → ${filename}`)
        resolve({ messageId: id, filename })
      } else {
        reject(new Error(`TTS: ${out}`))
      }
    })
  })
}
