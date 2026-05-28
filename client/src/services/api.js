const BASE = '/api'

export async function sendMessage(messages, voice, onChunk, signal, skipTts = false) {
  const response = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, voice, skipTts }),
    signal,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `请求失败 (${response.status})`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let audioUrl = null
  let messageId = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (!data) continue

      try {
        const parsed = JSON.parse(data)
        switch (parsed.type) {
          case 'chunk':
            onChunk(parsed.content)
            break
          case 'done':
            audioUrl = parsed.audioUrl
            messageId = parsed.messageId
            break
          case 'error':
            throw new Error(parsed.error)
        }
      } catch (err) {
        if (err.message && !err.message.startsWith('Unexpected')) throw err
      }
    }
  }

  return { audioUrl, messageId }
}

export async function exportChat(messages, format) {
  const response = await fetch(`${BASE}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, format }),
  })

  if (!response.ok) {
    throw new Error('导出失败')
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `chat-export.${format === 'markdown' ? 'md' : format}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
