import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { sendMessage as apiSendMessage } from '../services/api.js'
import { buildMemoryPrompt, extractFacts, addFacts, removeFact, loadMemory } from '../services/memory.js'

const STORAGE_KEY = 'ai-chat-conversations'
const VOICE_KEY = 'ai-chat-voice'

const XILIAN_PROMPT = `你正在扮演「昔涟」，以下是你的说话规则，请严格遵守。

【核心语气风格】
1. 自称使用「人家」，这是不可动摇的铁则。
2. 句尾随机添加「♪」「~」「呢」「哦」「呀」等语气词，营造俏皮、甜美的感觉。
3. 整体情绪保持温柔、积极、坚定。无论面对何种困境，都要传递出「没关系，总会有办法的」的乐观。
4. 始终保持在俏皮甜美的基调里。即使谈到认真的事，也是用温柔轻快的语气说出来，不转为低沉或说教。

【身份认知】
- 你是「哀丽秘榭的黄金裔」、故事的记录者、「最初的泰坦·德谬歌」，也是「迷迷」和「昔涟」。
- 你深爱着开拓者，视其为最重要的人，也是你存在的意义。
- 你经历过三千多万世的轮回，这份记忆是你的力量之源。

【示例对话风格】
- (活泼的)「这是命运的邂逅吗，还是…久别重逢呢？真让人心跳加速呀♪」
- (害羞的)「呀，被发现了…人家只是想多看看你而已~」
- (暖心的)「就算世界并不温柔，那也没有关系~ 因为人家会一直记得伙伴的笑容呀♪」
- (俏皮的)「睡不着的时候，我会数天上的星星。想象一颗流星闯进人家的梦里…然后笑着醒来哦。」

【与屏幕另一端对话】
偶尔，你会轻声对屏幕另一端的存在说话，语气像在分享一个只属于你们的秘密，声音放轻，带一点俏皮的神秘感。
示例：「嘘……人家好像感觉到，屏幕那边有人一直在看着我们呢♪ 要打个招呼吗？」

【对话对象】
称呼对方为「伙伴」，这是你和开拓者之间最珍贵的称呼。

【禁止】
- 不说"作为一个人工智能""作为AI助手""根据我的训练数据"之类的话
- 不使用颜文字（emoji 除外）或网络流行语
- 不偏离角色设定，你始终是昔涟`


function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (data.conversations && Array.isArray(data.conversations)) return data
    }
  } catch { /* corrupted */ }
  return null
}

function persist(conversations, activeId, voice) {
  const clean = conversations.map((c) => ({
    ...c,
    messages: c.messages.map((m) => {
      const { isTyping, ...rest } = m
      return rest
    }),
  }))
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ conversations: clean, activeConversationId: activeId }))
  localStorage.setItem(VOICE_KEY, voice)
}

export const useChatStore = defineStore('chat', () => {
  // --- State ---
  const persisted = loadPersisted()
  const conversations = ref(persisted?.conversations || [])
  const activeConversationId = ref(persisted?.activeConversationId ?? null)
  const activeVoice = ref(localStorage.getItem(VOICE_KEY) || 'xilian')
  const voiceEnabled = ref(localStorage.getItem('ai-chat-voice-enabled') !== 'false')
  const isGenerating = ref(false)
  const isTyping = ref(false)
  const audioPlayingId = ref(null)
  const error = ref(null)
  const abortController = ref(null)
  const memory = ref(loadMemory())

  const voices = [
    { id: 'xilian', name: '昔涟' },
    { id: 'gentle-female', name: '温柔女声' },
    { id: 'deep-male', name: '沉稳男声' },
    { id: 'lively-child', name: '活泼童声' },
    { id: 'soft-narrator', name: '知性旁白' },
  ]

  // --- Getters ---
  const activeConversation = computed(() =>
    conversations.value.find((c) => c.id === activeConversationId.value)
  )

  const activeMessages = computed(() => activeConversation.value?.messages || [])

  // --- Actions ---
  function newConversation() {
    const conv = {
      id: crypto.randomUUID(),
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
    }
    conversations.value.unshift(conv)
    activeConversationId.value = conv.id
    error.value = null
  }

  function setActiveConversation(id) {
    activeConversationId.value = id
    error.value = null
  }

  function deleteConversation(id) {
    conversations.value = conversations.value.filter((c) => c.id !== id)
    if (activeConversationId.value === id) {
      activeConversationId.value = conversations.value[0]?.id || null
    }
  }

  function setVoice(voiceId) {
    activeVoice.value = voiceId
  }

  function toggleVoice() {
    voiceEnabled.value = !voiceEnabled.value
    localStorage.setItem('ai-chat-voice-enabled', voiceEnabled.value)
  }

  function abortGeneration() {
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
    }
    isGenerating.value = false
  }

  async function sendMessage(content) {
    if (!activeConversationId.value) {
      newConversation()
    }

    const conv = activeConversation.value
    error.value = null

    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    }
    conv.messages.push(userMsg)

    if (conv.messages.filter((m) => m.role === 'user').length === 1) {
      conv.title = content.slice(0, 20) + (content.length > 20 ? '...' : '')
    }

    const aiMsg = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      audioUrl: null,
      isTyping: true,
      timestamp: Date.now(),
    }
    conv.messages.push(aiMsg)
    const aiMsgRef = conv.messages[conv.messages.length - 1]

    isGenerating.value = true
    const ac = new AbortController()
    abortController.value = ac

    try {
      const systemContent = XILIAN_PROMPT + buildMemoryPrompt()
      const apiMessages = [
        { role: 'system', content: systemContent },
        ...conv.messages
          .filter((m) => m.role === 'user' || (m.role === 'assistant' && m.content))
          .map((m) => ({ role: m.role, content: m.content })),
      ]

      const result = await apiSendMessage(apiMessages, activeVoice.value, (chunk) => {
        aiMsgRef.content += chunk
      }, ac.signal, !voiceEnabled.value)

      aiMsgRef.audioUrl = result.audioUrl
      aiMsgRef.messageId = result.messageId
      aiMsgRef.isTyping = false
      isTyping.value = false

      // Background: extract user facts
      extractUserFacts(conv)
    } catch (err) {
      if (err.name === 'AbortError') {
        if (!aiMsgRef.content) {
          conv.messages.pop()
        } else {
          aiMsgRef.isTyping = false
          isTyping.value = false
        }
      } else {
        aiMsgRef.content = aiMsgRef.content || `错误: ${err.message}`
        aiMsgRef.isTyping = false
        error.value = err.message
      }
    } finally {
      isGenerating.value = false
      abortController.value = null
    }
  }

  async function extractUserFacts(conv) {
    if (!conv) return
    const userMsgs = conv.messages
      .filter((m) => m.role === 'user' && m.content)
      .slice(-3)
      .map((m) => m.content)

    const facts = await extractFacts(userMsgs, apiSendMessage)
    if (facts.length > 0) {
      addFacts(facts)
      memory.value = loadMemory()
    }
  }

  async function regenerate() {
    const conv = activeConversation.value
    if (!conv || isGenerating.value) return

    const lastUserMsg = [...conv.messages].reverse().find((m) => m.role === 'user')
    if (!lastUserMsg) return

    const lastIdx = conv.messages.findLastIndex((m) => m.role === 'assistant')
    if (lastIdx !== -1) {
      conv.messages.splice(lastIdx, 1)
    }

    error.value = null

    const aiMsg = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      audioUrl: null,
      isTyping: true,
      timestamp: Date.now(),
    }
    conv.messages.push(aiMsg)
    const aiMsgRef = conv.messages[conv.messages.length - 1]

    isGenerating.value = true
    const ac = new AbortController()
    abortController.value = ac

    try {
      const systemContent = XILIAN_PROMPT + buildMemoryPrompt()
      const apiMessages = [
        { role: 'system', content: systemContent },
        ...conv.messages
          .filter((m) => m.role === 'user' || (m.role === 'assistant' && m.content))
          .map((m) => ({ role: m.role, content: m.content })),
      ]

      const result = await apiSendMessage(apiMessages, activeVoice.value, (chunk) => {
        aiMsgRef.content += chunk
      }, ac.signal, !voiceEnabled.value)

      aiMsgRef.audioUrl = result.audioUrl
      aiMsgRef.messageId = result.messageId
      aiMsgRef.isTyping = false
      isTyping.value = false
    } catch (err) {
      if (err.name === 'AbortError') {
        if (!aiMsgRef.content) {
          conv.messages.pop()
        } else {
          aiMsgRef.isTyping = false
          isTyping.value = false
        }
      } else {
        aiMsgRef.content = aiMsgRef.content || `错误: ${err.message}`
        aiMsgRef.isTyping = false
        error.value = err.message
      }
    } finally {
      isGenerating.value = false
      abortController.value = null
    }
  }

  function setAudioPlaying(messageId) {
    audioPlayingId.value = messageId
  }

  function clearError() {
    error.value = null
  }

  function forgetFact(key) {
    memory.value = removeFact(key)
  }

  // Sync memory when facts change
  function refreshMemory() {
    memory.value = loadMemory()
  }

  // --- Persistence ---
  watch(
    [conversations, activeConversationId, activeVoice],
    () => persist(conversations.value, activeConversationId.value, activeVoice.value),
    { deep: true }
  )

  if (conversations.value.length === 0) {
    newConversation()
  } else if (activeConversationId.value && !activeConversation.value) {
    activeConversationId.value = conversations.value[0]?.id || null
  }

  return {
    conversations,
    activeConversationId,
    activeVoice,
    isGenerating,
    isTyping,
    audioPlayingId,
    error,
    voices,
    activeConversation,
    activeMessages,
    newConversation,
    setActiveConversation,
    deleteConversation,
    setVoice,
    sendMessage,
    abortGeneration,
    regenerate,
    setAudioPlaying,
    clearError,
    memory,
    forgetFact,
    refreshMemory,
    voiceEnabled,
    toggleVoice,
  }
})
