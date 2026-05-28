<script setup>
import { useChatStore } from '../stores/chat.js'
import MessageList from './MessageList.vue'
import ChatInput from './ChatInput.vue'
import VoiceSelector from './VoiceSelector.vue'
import WelcomeScreen from './WelcomeScreen.vue'
import TypingIndicator from './TypingIndicator.vue'

const store = useChatStore()
</script>

<template>
  <main class="chat-window">
    <div class="chat-header">
      <h1 class="chat-title">
        {{ store.character.ui.title }}
      </h1>
      <div class="header-actions">
        <VoiceSelector :class="{ dimmed: !store.voiceEnabled }" />
        <button
          class="voice-toggle"
          :title="store.voiceEnabled ? '关闭语音' : '开启语音'"
          @click="store.toggleVoice()"
        >
          <svg v-if="store.voiceEnabled" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        </button>
      </div>
    </div>

    <WelcomeScreen v-if="store.activeMessages.length === 0" />

    <template v-else>
      <MessageList />

      <Transition name="fade">
        <div v-if="store.isGenerating && store.activeMessages.length > 0" class="generating-hint">
          <TypingIndicator />
          <span class="hint-text">{{ store.character.ui.generatingHint }}</span>
          <button class="hint-stop-btn" @click="store.abortGeneration()">停止</button>
        </div>
      </Transition>

      <Transition name="fade">
        <div v-if="!store.isGenerating && store.activeMessages.length > 0" class="action-bar">
          <button
            class="regen-btn"
            :disabled="store.isGenerating"
            @click="store.regenerate()"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
            重新生成
          </button>
        </div>
      </Transition>
    </template>

    <ChatInput />
  </main>
</template>

<style scoped>
.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-width: 0;
  background: var(--bg-chat);
  backdrop-filter: blur(8px);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.chat-title {
  font-size: 1.1rem;
  font-weight: 600;
  background: linear-gradient(135deg, var(--accent-pink), var(--accent-teal));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.voice-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(4px);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}
.voice-toggle:hover {
  background: rgba(255, 255, 255, 0.8);
  color: var(--text-primary);
}

.dimmed {
  opacity: 0.4;
  pointer-events: none;
}

.generating-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 20px;
  background: rgba(255, 255, 255, 0.4);
}

.hint-text {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.hint-stop-btn {
  margin-left: auto;
  padding: 4px 12px;
  border: none;
  border-radius: 12px;
  background: #ef4444;
  color: #fff;
  font-size: 0.75rem;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s;
}
.hint-stop-btn:hover {
  background: #dc2626;
}

.action-bar {
  display: flex;
  align-items: center;
  padding: 6px 20px;
  background: rgba(255, 255, 255, 0.4);
}

.regen-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  color: var(--text-primary);
  font-size: 0.8rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}
.regen-btn:hover:not(:disabled) {
  border-color: var(--accent-blue);
  color: var(--accent-blue);
}
.regen-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
