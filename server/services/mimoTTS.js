import { writeFile, mkdir, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const AUDIO_DIR = join(__dirname, '..', 'public', 'audio')
const CONFIG_PATH = join(__dirname, '..', '..', 'character.json')

// Voice clone sample cache
let voiceDataCache = null
let characterConfig = null

async function loadCharacterConfig() {
  if (characterConfig) return characterConfig
  const raw = await readFile(CONFIG_PATH, 'utf-8')
  characterConfig = JSON.parse(raw)
  return characterConfig
}

function concatWavs(buffers) {
  if (buffers.length === 0) return null
  if (buffers.length === 1) return buffers[0]

  // Use first file's header as template
  const header = buffers[0].subarray(0, 44)
  const pcmChunks = buffers.map((b) => b.subarray(44))
  const totalPcm = Buffer.concat(pcmChunks)
  const totalSize = 44 + totalPcm.length

  const combined = Buffer.alloc(totalSize)
  // Copy header from first file
  combined.set(header, 0)
  // Update RIFF chunk size (offset 4) = totalSize - 8
  combined.writeUInt32LE(totalSize - 8, 4)
  // Update data chunk size (offset 40) = totalPcm.length
  combined.writeUInt32LE(totalPcm.length, 40)
  // Copy PCM data
  combined.set(totalPcm, 44)

  return combined
}

async function loadVoiceSample() {
  if (voiceDataCache) return voiceDataCache
  const config = await loadCharacterConfig()
  const samplesDir = join(__dirname, '..', 'public')

  // Support both single sample (backward compat) and multiple samples
  let buf
  const sampleFiles = config.voice?.sampleFiles
  if (sampleFiles && sampleFiles.length > 0) {
    const buffers = []
    for (const file of sampleFiles) {
      const samplePath = join(samplesDir, file)
      if (existsSync(samplePath)) {
        buffers.push(await readFile(samplePath))
      }
    }
    if (buffers.length > 0) {
      buf = concatWavs(buffers)
      console.log(`Voice samples loaded: ${buffers.length} files, combined ${(buf.length / 1024 / 1024).toFixed(1)} MB`)
    }
  } else {
    // Backward compat: single sampleFile
    const sampleFile = config.voice?.sampleFile || 'xilian-voice.mp3'
    const samplePath = join(samplesDir, sampleFile)
    if (existsSync(samplePath)) {
      buf = await readFile(samplePath)
      console.log(`Voice sample loaded: ${(buf.length / 1024 / 1024).toFixed(1)} MB`)
    }
  }

  if (buf) {
    const ext = buf[0] === 0x52 && buf[1] === 0x49 ? 'wav' : 'mpeg'
    voiceDataCache = `data:audio/${ext};base64,${buf.toString('base64')}`
  }
  return voiceDataCache
}

async function getVoiceDirector() {
  const config = await loadCharacterConfig()
  return config.voice?.directorPrompt || ''
}

// Preset voice configs for mimo-v2.5-tts
const VOICE_PRESETS = {
  'gentle-female':  { voice: '茉莉',   style: '用温柔清亮的女性嗓音，语气亲切自然，语速适中，像朋友聊天一样舒服。' },
  'deep-male':      { voice: '苏打',   style: '用沉稳有磁性的男性嗓音，语调平和笃定，语速稍慢，给人可靠的感觉。' },
  'lively-child':   { voice: '冰糖',   style: '用活泼明快的嗓音，语调轻快上扬，语速稍快，带着满满的好奇心和热情。' },
  'soft-narrator':  { voice: '白桦',   style: '用温润知性的男性嗓音，节奏平稳清晰，像深夜电台主播一样娓娓道来。' },
}

export async function synthesizeSpeech(text, voiceId = 'xilian') {
  const isXilian = voiceId === 'xilian'
  const baseURL = process.env.MIMO_BASE_URL

  let model, body

  if (isXilian) {
    const voiceData = await loadVoiceSample()
    if (!voiceData) {
      throw new Error('Voice sample not found for voice clone')
    }
    const directorPrompt = await getVoiceDirector()
    model = 'mimo-v2.5-tts-voiceclone'
    body = {
      model,
      messages: [
        { role: 'user', content: directorPrompt },
        { role: 'assistant', content: text },
      ],
      audio: {
        format: 'wav',
        voice: voiceData,
      },
    }
  } else {
    const preset = VOICE_PRESETS[voiceId] || VOICE_PRESETS['gentle-female']
    model = process.env.MIMO_TTS_MODEL || 'mimo-v2.5-tts'
    body = {
      model,
      messages: [
        { role: 'user', content: preset.style },
        { role: 'assistant', content: text },
      ],
      audio: {
        format: 'wav',
        voice: preset.voice,
      },
    }
  }

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.MIMO_API_KEY,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errBody = await response.text()
    throw new Error(`Mimo TTS error ${response.status}: ${errBody}`)
  }

  const data = await response.json()
  const audioBase64 = data.choices?.[0]?.message?.audio?.data

  if (!audioBase64) {
    throw new Error('No audio data in Mimo TTS response')
  }

  const audioBuffer = Buffer.from(audioBase64, 'base64')

  const ext =
    audioBuffer[0] === 0x52 && audioBuffer[1] === 0x49
      ? 'wav'
      : audioBuffer[0] === 0xff || audioBuffer[0] === 0x49
        ? 'mp3'
        : 'wav'

  const messageId = randomUUID()
  const filename = `${messageId}.${ext}`
  const filepath = join(AUDIO_DIR, filename)

  await mkdir(AUDIO_DIR, { recursive: true })
  await writeFile(filepath, audioBuffer)

  return { messageId, filename }
}
