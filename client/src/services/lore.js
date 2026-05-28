// 世界观知识库引擎 — 从 /lore.json 加载数据
// 替换 public/lore.json 即可定制自己的知识库

let index = null
let ready = false

async function ensureIndex() {
  if (ready) return
  try {
    const res = await fetch('/lore.json')
    const entries = await res.json()
    index = {}
    for (const item of entries) {
      for (const kw of item.keywords) {
        const key = kw.trim().toLowerCase()
        index[key] = item.entry
      }
    }
    ready = true
  } catch {
    index = {}
    ready = true
  }
}

export async function searchLore(userMessage) {
  await ensureIndex()
  if (!index || Object.keys(index).length === 0) {
    return { knowledge: '', matched: [] }
  }

  const input = userMessage.toLowerCase()
  const matched = new Set()

  for (const [keyword, entry] of Object.entries(index)) {
    if (input.includes(keyword)) {
      matched.add(keyword)
    }
  }

  if (matched.size === 0) return { knowledge: '', matched: [] }

  const entries = new Set()
  for (const keyword of matched) {
    entries.add(index[keyword])
  }

  const knowledge = [...entries]
    .map((e, i) => `${i + 1}. ${e}`)
    .join('\n')

  return {
    knowledge: `\n## 需要了解的相关事实（来自世界观知识库）\n${knowledge}`,
    matched: [...matched],
  }
}
