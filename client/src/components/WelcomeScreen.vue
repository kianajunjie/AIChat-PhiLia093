<script setup>
import { useChatStore } from '../stores/chat.js'
const store = useChatStore()
</script>

<template>
  <div class="welcome-screen">
    <div class="welcome-icon">
      <svg viewBox="0 0 64 64" width="64" height="64" fill="none">
        <path
          d="M32 54 C20 42 4 34 4 22 C4 12 12 6 20 6 C26 6 30 10 32 14 C34 10 38 6 44 6 C52 6 60 12 60 22 C60 34 44 42 32 54Z"
          fill="url(#heartGrad)"
          opacity="0.9"
        >
          <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
        </path>
        <defs>
          <linearGradient id="heartGrad" x1="4" y1="6" x2="60" y2="54">
            <stop offset="0%" stop-color="#f495a8" />
            <stop offset="50%" stop-color="#e67a94" />
            <stop offset="100%" stop-color="#d4627e" />
          </linearGradient>
        </defs>
      </svg>
    </div>
    <h2>{{ store.character.ui.welcomeLine1 }}</h2>
    <p v-if="store.character.ui.welcomeLine2">{{ store.character.ui.welcomeLine2 }}</p>
  </div>
</template>

<style scoped>
.welcome-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  text-align: center;
}
.welcome-icon {
  margin-bottom: 8px;
}
h2 {
  font-size: 1.4rem;
  font-weight: 600;
  background: linear-gradient(135deg, var(--accent-pink), var(--accent-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
p {
  color: var(--text-secondary);
  font-size: 0.9rem;
}
</style>
