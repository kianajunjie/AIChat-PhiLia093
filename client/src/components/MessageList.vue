<script setup>
import { ref, watch, nextTick } from 'vue'
import { useChatStore } from '../stores/chat.js'
import MessageBubble from './MessageBubble.vue'

const store = useChatStore()
const listRef = ref(null)

function scrollToBottom() {
  nextTick(() => {
    if (listRef.value) {
      listRef.value.scrollTop = listRef.value.scrollHeight
    }
  })
}

watch(
  () => store.activeMessages.length,
  () => scrollToBottom()
)

watch(
  () => store.isGenerating,
  () => scrollToBottom()
)
</script>

<template>
  <div ref="listRef" class="message-list">
    <div class="messages-inner">
      <MessageBubble
        v-for="msg in store.activeMessages"
        :key="msg.id"
        :message="msg"
      />
    </div>
  </div>
</template>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.messages-inner {
  display: flex;
  flex-direction: column;
  max-width: 800px;
  margin: 0 auto;
}
</style>
