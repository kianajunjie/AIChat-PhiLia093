import { writeFile, mkdir, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const AUDIO_DIR = join(__dirname, '..', 'public', 'audio')

// Voice clone sample cache
let xilianVoiceData = null

async function loadVoiceSample() {
  if (xilianVoiceData) return xilianVoiceData
  const samplePath = join(__dirname, '..', 'public', 'xilian-voice.mp3')
  if (existsSync(samplePath)) {
    const buf = await readFile(samplePath)
    const b64 = buf.toString('base64')
    xilianVoiceData = `data:audio/mpeg;base64,${b64}`
    console.log(`Voice sample loaded: ${(buf.length / 1024 / 1024).toFixed(1)} MB`)
  }
  return xilianVoiceData
}

// Preset voice configs for mimo-v2.5-tts
const VOICE_PRESETS = {
  'gentle-female':  { voice: '茉莉',   style: '用温柔清亮的女性嗓音，语气亲切自然，语速适中，像朋友聊天一样舒服。' },
  'deep-male':      { voice: '苏打',   style: '用沉稳有磁性的男性嗓音，语调平和笃定，语速稍慢，给人可靠的感觉。' },
  'lively-child':   { voice: '冰糖',   style: '用活泼明快的嗓音，语调轻快上扬，语速稍快，带着满满的好奇心和热情。' },
  'soft-narrator':  { voice: '白桦',   style: '用温润知性的男性嗓音，节奏平稳清晰，像深夜电台主播一样娓娓道来。' },
}

// Xilian voice style — director mode
const XILIAN_DIRECTOR = `【角色】
粉发少女昔涟，俏皮甜美的迷迷形态。自称"人家"，爱笑、爱撒娇、爱和伙伴聊天。声音明亮活泼，像撒在湖面上的阳光，跳跃、闪烁、轻巧。

【场景】
正在和她最喜欢的"伙伴"聊天。没有什么沉重的事，就是开开心心的日常。她在笑，在分享，偶尔眨一下眼睛。

【指导】
- 语速：轻快活泼，像踩着节拍蹦蹦跳跳。句与句之间流畅自然，不拖不慢。
- 音色：清亮甜美，发声像在微笑。说到"人家"时有小小的亲密感，说到"伙伴"时带一丝暖意。
- 句尾细节："♪"时语调跳跃上扬，像开心得快要唱出来；"~"时尾音轻巧延长然后收住；"呢""哦""呀"时轻快收尾，不拖不黏。
- 咬字：清脆分明，颗颗干净，像糖果从罐子里倒出来，叮叮咚咚。`


export async function synthesizeSpeech(text, voiceId = 'xilian') {
  const isXilian = voiceId === 'xilian'
  const baseURL = process.env.MIMO_BASE_URL

  let model, body

  if (isXilian) {
    const voiceData = await loadVoiceSample()
    if (!voiceData) {
      throw new Error('Voice sample not found for Xilian voice clone')
    }
    model = 'mimo-v2.5-tts-voiceclone'
    body = {
      model,
      messages: [
        { role: 'user', content: XILIAN_DIRECTOR },
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
