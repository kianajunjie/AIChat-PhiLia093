import { Router } from 'express'
import { streamDeepSeek } from '../services/deepseek.js'
import { synthesizeSpeech as mimoSpeech } from '../services/mimoTTS.js'
import { synthesizeSpeech as localSpeech } from '../services/localTTS.js'

// 通过 .env 控制使用本地还是远程 TTS
const USE_LOCAL_TTS = process.env.LOCAL_TTS === 'true'
const synthesizeSpeech = USE_LOCAL_TTS ? localSpeech : mimoSpeech

const router = Router()

router.post('/chat', async (req, res) => {
  try {
    const { messages, voice = 'gentle-female', skipTts = false } = req.body

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages 数组不能为空' })
    }

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    let fullText = ''

    // Stream text chunks from DeepSeek
    for await (const chunk of streamDeepSeek(messages)) {
      fullText += chunk
      res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`)
    }

    if (!fullText) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'AI 返回了空回复' })}\n\n`)
      res.end()
      return
    }

    // Synthesize speech after streaming completes
    let audioUrl = null
    let messageId = null
    if (!skipTts) {
      try {
        const result = await synthesizeSpeech(fullText, voice)
        messageId = result.messageId
        audioUrl = `/audio/${result.filename}`
      } catch (ttsErr) {
        console.error('TTS synthesis failed:', ttsErr.message)
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done', audioUrl, messageId })}\n\n`)
    res.end()
  } catch (err) {
    console.error('Chat error:', err.message)
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`)
      res.end()
    } else {
      res.status(500).json({ error: err.message || '处理请求失败' })
    }
  }
})

export default router
