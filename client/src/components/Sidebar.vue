<script setup>
import { useChatStore } from '../stores/chat.js'
import ExportButton from './ExportButton.vue'

const store = useChatStore()

function formatDate(ts) {
  const d = new Date(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <button class="new-chat-btn" @click="store.newConversation()">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
        <span>翻开新的一页</span>
      </button>
    </div>

    <div class="conversation-list">
      <div
        v-for="conv in store.conversations"
        :key="conv.id"
        class="conv-item"
        :class="{ active: conv.id === store.activeConversationId }"
        @click="store.setActiveConversation(conv.id)"
      >
        <div class="conv-content">
          <div class="conv-title">{{ conv.title }}</div>
          <div class="conv-meta">{{ formatDate(conv.createdAt) }}</div>
        </div>
        <button
          class="conv-delete"
          title="删除对话"
          @click.stop="store.deleteConversation(conv.id)"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
          </svg>
        </button>
      </div>
    </div>

    <div v-if="store.memory.facts.length > 0" class="memory-section">
      <div class="memory-header">
        <span class="memory-title">{{ store.character.ui.memoryTitle }}</span>
      </div>
      <div class="memory-list">
        <div v-for="fact in store.memory.facts" :key="fact.key" class="memory-item">
          <div class="memory-item-text">
            <span class="memory-key">{{ fact.key }}</span>
            <span class="memory-value">{{ fact.value }}</span>
          </div>
          <button
            class="memory-delete"
            title="忘记这条"
            @click="store.forgetFact(fact.key)"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div class="sidebar-footer">
      <ExportButton />
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 260px;
  min-width: 260px;
  height: 100vh;
  background: var(--bg-sidebar);
  backdrop-filter: blur(12px);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  z-index: 10;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--border);
}

.new-chat-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.8);
  color: var(--text-primary);
  font-size: 0.9rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}
.new-chat-btn:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: var(--accent-blue);
  color: var(--accent-blue);
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.conv-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s;
  margin-bottom: 2px;
}
.conv-item:hover {
  background: rgba(59, 130, 246, 0.08);
}
.conv-item.active {
  background: rgba(59, 130, 246, 0.15);
}

.conv-content {
  flex: 1;
  min-width: 0;
}

.conv-title {
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-meta {
  font-size: 0.72rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.conv-delete {
  opacity: 0;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-sm);
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}
.conv-item:hover .conv-delete {
  opacity: 1;
}
.conv-delete:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.memory-section {
  padding: 8px;
  border-top: 1px solid var(--border);
  max-height: 180px;
  overflow-y: auto;
}

.memory-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px 8px;
}

.memory-title {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.memory-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.memory-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  transition: background 0.15s;
}

.memory-item:hover {
  background: rgba(232, 146, 165, 0.08);
}

.memory-item-text {
  flex: 1;
  min-width: 0;
  font-size: 0.78rem;
  line-height: 1.3;
}

.memory-key {
  color: var(--accent-pink);
  font-weight: 500;
}

.memory-value {
  color: var(--text-secondary);
  margin-left: 4px;
}

.memory-delete {
  opacity: 0;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
}

.memory-item:hover .memory-delete {
  opacity: 1;
}

.memory-delete:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.sidebar-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border);
}

@media (max-width: 640px) {
  .sidebar {
    width: 100%;
    min-width: 100%;
    height: auto;
    max-height: 200px;
  }
}
</style>
