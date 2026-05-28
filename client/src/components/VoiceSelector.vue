<script setup>
import { useChatStore } from '../stores/chat.js'

const store = useChatStore()
</script>

<template>
  <div class="voice-selector">
    <label class="voice-label">音色</label>
    <select
      class="voice-select"
      :value="store.activeVoice"
      @change="store.setVoice($event.target.value)"
    >
      <option v-for="v in store.voices" :key="v.id" :value="v.id">
        {{ v.name }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.voice-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: var(--radius-full);
  backdrop-filter: blur(4px);
}

.voice-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

.voice-select {
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.85rem;
  font-family: inherit;
  color: var(--text-primary);
  cursor: pointer;
  padding: 2px 4px;
}
</style>
