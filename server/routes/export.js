import { Router } from 'express'

const router = Router()

router.post('/export', (req, res) => {
  try {
    const { messages, format = 'markdown' } = req.body

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages 数组不能为空' })
    }

    let content, mimeType, filename

    switch (format) {
      case 'json':
        content = JSON.stringify(messages, null, 2)
        mimeType = 'application/json'
        filename = `chat-export-${Date.now()}.json`
        break

      case 'txt':
        content = messages
          .map(
            (m) =>
              `[${m.role === 'user' ? '用户' : 'AI'}] ${new Date(m.timestamp).toLocaleString()}\n${m.content}\n`
          )
          .join('\n---\n\n')
        mimeType = 'text/plain; charset=utf-8'
        filename = `chat-export-${Date.now()}.txt`
        break

      case 'markdown':
      default:
        content = messages
          .map((m) => {
            const role = m.role === 'user' ? '**用户**' : '**AI**'
            const time = new Date(m.timestamp).toLocaleString()
            return `### ${role} — ${time}\n\n${m.content}\n`
          })
          .join('\n---\n\n')
        mimeType = 'text/markdown; charset=utf-8'
        filename = `chat-export-${Date.now()}.md`
        break
    }

    res.setHeader('Content-Type', mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(content)
  } catch (err) {
    console.error('Export error:', err.message)
    res.status(500).json({ error: err.message || '导出失败' })
  }
})

export default router
