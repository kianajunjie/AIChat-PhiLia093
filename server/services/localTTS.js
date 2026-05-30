import { execFile } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { mkdir } from 'node:fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))

// GPT-SoVITS 路径配置
const SOVITS_HOME = 'D:/GPT-SoVITS/GPT-SoVITS-v3lora-20250228'
const PYTHON = `${SOVITS_HOME}/runtime/python.exe`
const SCRIPT = `${SOVITS_HOME}/local_tts.py`
const AUDIO_DIR = join(__dirname, '..', 'public', 'audio')

/**
 * 清洗文本，去掉 TTS 模型不认识的符号
 */
function cleanText(text) {
  return text
    .replace(/[（(][^）)]*[）)]/g, '')   // 去掉中文/英文括号内容
    .replace(/【.*?】/g, '')              // 去掉【】
    .replace(/[「」『』]/g, '')           // 去掉日式引号
    .replace(/[*_~`#]/g, '')              // 去掉 markdown 符号
    .replace(/♪|～|~|♡|❤|✨|🌟|💕/g, '') // 去掉装饰符号
    .replace(/\s+/g, ' ')                 // 合并空白
    .trim()
}

/**
 * 本地 TTS 合成
 * @param {string} text - 要合成的文字
 * @returns {Promise<{messageId: string, filename: string}>}
 */
export async function synthesizeSpeech(text) {
  text = cleanText(text)
  if (!text) throw new Error('TTS: text empty after cleaning')
  const messageId = randomUUID()
  const filename = `${messageId}.wav`
  const outPath = join(AUDIO_DIR, filename)

  await mkdir(AUDIO_DIR, { recursive: true })

  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    execFile(PYTHON, [SCRIPT, text, outPath], {
      timeout: 120000,
      maxBuffer: 1024 * 1024,
    }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(`TTS process failed: ${err.message}`))
        return
      }

      const output = stdout.trim()
      if (output.startsWith('OK:')) {
        const [, path, dur] = output.split(':')
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
        console.log(`[TTS] ${dur} audio in ${elapsed}s → ${filename}`)
        resolve({ messageId, filename })
      } else {
        reject(new Error(`TTS failed: ${output}`))
      }
    })
  })
}
