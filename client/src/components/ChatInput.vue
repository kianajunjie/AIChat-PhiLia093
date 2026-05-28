<script setup>
import { ref, nextTick } from 'vue'
import { useChatStore } from '../stores/chat.js'

const store = useChatStore()
const input = ref('')
const textareaRef = ref(null)

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 150) + 'px'
}

async function handleSend() {
  const text = input.value.trim()
  if (!text || store.isGenerating || store.isTyping) return
  input.value = ''
  await nextTick()
  const el = textareaRef.value
  if (el) {
    el.style.height = 'auto'
  }
  store.sendMessage(text)
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}
</script>

<template>
  <div class="chat-input">
    <div class="input-row">
      <textarea
        ref="textareaRef"
        v-model="input"
        class="input-field"
        :placeholder="store.character.ui.placeholder"
        rows="1"
        :disabled="store.isGenerating"
        @input="autoResize"
        @keydown="handleKeydown"
      />
      <button
        v-if="store.isGenerating"
        class="stop-btn"
        title="停止生成"
        @click="store.abortGeneration()"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="1" />
        </svg>
      </button>
      <button
        v-else
        class="send-btn"
        :disabled="!input.trim()"
        @click="handleSend"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.chat-input {
  padding: 12px 16px 16px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  border-top: 1px solid var(--border);
}

.input-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  background: var(--bg-input);
  border-radius: var(--radius-lg);
  padding: 8px 8px 8px 16px;
  box-shadow: var(--shadow);
}

.input-field {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  font-size: 0.95rem;
  font-family: inherit;
  color: var(--text-primary);
  background: transparent;
  line-height: 1.5;
  max-height: 150px;
  padding: 4px 0;
}
.input-field::placeholder {
  color: var(--text-secondary);
}
.input-field:disabled {
  opacity: 0.6;
}

.send-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: var(--accent-blue);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}
.send-btn:hover:not(:disabled) {
  background: var(--accent-pink);
  transform: scale(1.05);
}
.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stop-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: #ef4444;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}
.stop-btn:hover {
  background: #dc2626;
  transform: scale(1.05);
}
</style>
