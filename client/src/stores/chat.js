import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { sendMessage as apiSendMessage } from '../services/api.js'
import { buildMemoryPrompt, extractFacts, addFacts, removeFact, loadMemory } from '../services/memory.js'

const STORAGE_KEY = 'ai-chat-conversations'
const VOICE_KEY = 'ai-chat-voice'

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

// Default character config used before loading from API
const DEFAULT_CHARACTER = {
  name: '角色',
  systemPrompt: '',
  ui: {
    title: 'AI Chat',
    welcomeLine1: '欢迎，开始对话吧',
    welcomeLine2: '',
    placeholder: '输入消息… Enter 发送',
    memoryTitle: '记忆簿',
    generatingHint: '正在生成回复…',
  },
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
  const character = ref(DEFAULT_CHARACTER)

  const voices = computed(() => [
    { id: 'xilian', name: character.value.name },
    { id: 'gentle-female', name: '温柔女声' },
    { id: 'deep-male', name: '沉稳男声' },
    { id: 'lively-child', name: '活泼童声' },
    { id: 'soft-narrator', name: '知性旁白' },
  ])

  // --- Getters ---
  const activeConversation = computed(() =>
    conversations.value.find((c) => c.id === activeConversationId.value)
  )

  const activeMessages = computed(() => activeConversation.value?.messages || [])

  // --- Actions ---
  async function loadCharacter() {
    try {
      const res = await fetch('/api/character')
      if (res.ok) {
        const data = await res.json()
        character.value = data
      }
    } catch { /* keep defaults */ }
  }

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
      const systemContent = character.value.systemPrompt + buildMemoryPrompt()
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
      const systemContent = character.value.systemPrompt + buildMemoryPrompt()
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
    character,
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
    loadCharacter,
  }
})
