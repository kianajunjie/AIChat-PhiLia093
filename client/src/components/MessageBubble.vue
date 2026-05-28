<script setup>
import { computed } from 'vue'
import ChatAvatar from './ChatAvatar.vue'
import AudioPlayer from './AudioPlayer.vue'
import { useChatStore } from '../stores/chat.js'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import python from 'highlight.js/lib/languages/python'
import css from 'highlight.js/lib/languages/css'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import xml from 'highlight.js/lib/languages/xml'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('css', css)
hljs.registerLanguage('json', json)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('html', xml)

const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return (
          '<pre class="hljs"><code>' +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          '</code></pre>'
        )
      } catch {}
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>'
  },
})

const props = defineProps({
  message: { type: Object, required: true },
})

const store = useChatStore()

const renderedContent = computed(() => {
  const text = props.message.content
  if (!text) return ''
  return md.render(text)
})
</script>

<template>
  <div
    class="message-bubble"
    :class="message.role === 'user' ? 'msg-user' : 'msg-ai'"
  >
    <ChatAvatar
      :src="message.role === 'user' ? '/avatars/user-avatar.jpg' : '/avatars/ai-avatar.jpg'"
      :size="28"
    />

    <div class="bubble" :class="message.role === 'user' ? 'bubble-user' : 'bubble-ai'">
      <div
        class="bubble-content markdown-body"
        v-html="renderedContent"
      />

      <span v-if="message.isTyping && !renderedContent" class="cursor-blink">|</span>

      <div v-if="store.isGenerating && !renderedContent" class="loading-dots">
        <span /><span /><span />
      </div>

      <AudioPlayer
        v-if="message.role === 'assistant' && message.audioUrl && !message.isTyping"
        :audio-url="message.audioUrl"
        :message-id="message.id"
      />
    </div>
  </div>
</template>

<style scoped>
.message-bubble {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  max-width: 80%;
  margin-bottom: 4px;
}
.msg-user {
  align-self: flex-end;
  align-items: flex-end;
}
.msg-ai {
  align-self: flex-start;
  align-items: flex-start;
}

.bubble {
  padding: 10px 16px;
  border-radius: var(--radius-md);
  color: var(--text-bubble);
  box-shadow: var(--shadow-bubble);
  line-height: 1.6;
  font-size: 0.93rem;
  min-width: 60px;
  position: relative;
}
.bubble-user {
  background: var(--bubble-user);
}
.bubble-ai {
  background: var(--bubble-ai);
}

.bubble-content :deep(a) {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: underline;
}

.cursor-blink {
  animation: pulse 0.8s infinite;
  font-weight: 100;
  color: rgba(255, 255, 255, 0.6);
}

.loading-dots {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}
.loading-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  animation: pulse 1.2s infinite;
}
.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}
.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

.bubble :deep(.hljs) {
  background: rgba(0, 0, 0, 0.2) !important;
  color: #e2e8f0;
}
</style>
