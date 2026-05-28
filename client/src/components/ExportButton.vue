<script setup>
import { ref } from 'vue'
import { useChatStore } from '../stores/chat.js'
import { exportConversation, EXPORT_FORMATS } from '../utils/exportChat.js'

const store = useChatStore()
const showMenu = ref(false)

function toggleMenu() {
  showMenu.value = !showMenu.value
}

function handleExport(format) {
  if (store.activeMessages.length === 0) return
  exportConversation(store.activeMessages, format)
  showMenu.value = false
}

function handleClickOutside(e) {
  if (!e.target.closest('.export-wrapper')) {
    showMenu.value = false
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', handleClickOutside)
}
</script>

<template>
  <div class="export-wrapper">
    <button
      class="export-btn"
      :disabled="store.activeMessages.length === 0"
      @click.stop="toggleMenu"
      title="导出对话"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
      </svg>
      <span class="btn-text">导出</span>
    </button>

    <Transition name="fade">
      <div v-if="showMenu" class="export-menu">
        <button
          v-for="fmt in EXPORT_FORMATS"
          :key="fmt.id"
          class="export-option"
          @click="handleExport(fmt.id)"
        >
          <span class="option-icon">{{ fmt.icon }}</span>
          <span>{{ fmt.label }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.export-wrapper {
  position: relative;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: none;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.7);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.8rem;
  font-family: inherit;
  transition: all 0.2s;
}
.export-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.95);
  color: var(--text-primary);
}
.export-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.export-menu {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 6px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow);
  padding: 6px;
  min-width: 170px;
  z-index: 100;
}

.export-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  font-size: 0.85rem;
  font-family: inherit;
  color: var(--text-primary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background 0.15s;
}
.export-option:hover {
  background: rgba(59, 130, 246, 0.1);
}

.option-icon {
  font-size: 1rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
