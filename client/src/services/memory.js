const MEMORY_KEY = 'ai-chat-memory'

export function loadMemory() {
  try {
    const raw = localStorage.getItem(MEMORY_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* corrupted */ }
  return { facts: [], lastUpdated: 0 }
}

export function saveMemory(memory) {
  memory.lastUpdated = Date.now()
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memory))
}

export function addFacts(facts) {
  const memory = loadMemory()
  for (const fact of facts) {
    const existing = memory.facts.find(
      (f) => f.key.toLowerCase() === fact.key.toLowerCase()
    )
    if (existing) {
      existing.value = fact.value
    } else {
      memory.facts.push(fact)
    }
  }
  if (memory.facts.length > 50) {
    memory.facts = memory.facts.slice(-50)
  }
  saveMemory(memory)
  return memory
}

export function removeFact(key) {
  const memory = loadMemory()
  memory.facts = memory.facts.filter(
    (f) => f.key.toLowerCase() !== key.toLowerCase()
  )
  saveMemory(memory)
  return memory
}

export function clearMemory() {
  const empty = { facts: [], lastUpdated: 0 }
  saveMemory(empty)
  return empty
}

export function buildMemoryPrompt() {
  const memory = loadMemory()
  if (memory.facts.length === 0) return ''

  const facts = memory.facts.map((f) => `- ${f.key}：${f.value}`).join('\n')
  return `\n\n## 关于正在与你对话的人（你珍视的记忆）\n以下是你从历次对话中记录下来的、关于对方的事情。在合适的时候可以自然地提到这些，让对方感受到你的用心。但不要刻意炫耀自己的记忆力。\n${facts}`
}

const EXTRACTION_PROMPT = `你是一个信息提取助手。从以下用户消息中提取关于用户的关键个人信息。

规则：
1. 只提取明确的事实——偏好、习惯、身份、经历、兴趣、特征
2. 不要提取临时的、一次性的、对聊天主题的讨论
3. 如果消息中没有新的关键信息，返回空数组
4. 每条信息用简洁的 key-value 呈现

返回格式（纯 JSON 数组，不要 markdown）：
[{"key": "喜欢的颜色", "value": "绿色"}, {"key": "职业", "value": "学生"}]

用户消息：
`

export async function extractFacts(userMessages, sendFn) {
  if (!userMessages || userMessages.length === 0) return []

  const content = userMessages.join('\n')
  if (content.trim().length < 5) return []

  try {
    const messages = [
      { role: 'system', content: EXTRACTION_PROMPT },
      { role: 'user', content },
    ]

    let result = ''
    await sendFn(messages, '', (chunk) => {
      result += chunk
    }, null, true) // skipTts for background extraction

    // Parse JSON from response (strip markdown code fences if any)
    const jsonStr = result
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()

    const facts = JSON.parse(jsonStr)
    return Array.isArray(facts) ? facts : []
  } catch (err) {
    console.warn('Memory extraction failed (non-critical):', err.message)
    return []
  }
}
